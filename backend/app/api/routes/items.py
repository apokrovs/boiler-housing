from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app.api.deps import (
    SessionDep,
    get_current_active_superuser,
)
from app.models import (
    Item,
    ItemCreate,
    ItemPublic,
    ItemsPublic,
    ItemUpdate,
    Message,
    CheckoutsPublic,
)
from app import crud

router = APIRouter()


@router.get("/", response_model=ItemsPublic)
def read_items(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve items.
    """

    count_statement = select(func.count()).select_from(Item)
    count = session.exec(count_statement).one()

    statement = select(Item).offset(skip).limit(limit)
    items = session.exec(statement).all()

    return ItemsPublic(data=items, count=count)


@router.get("/{id}", response_model=ItemPublic)
def read_item(session: SessionDep, id: int) -> Any:
    """
    Get item by ID.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return item


@router.get("/checkouts/{id}", response_model=CheckoutsPublic)
def get_associated_checkouts(session: SessionDep, id: int) -> Any:
    """
    Get checkouts associated with an item.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    checkouts = item.checkouts

    return CheckoutsPublic(data=checkouts, count=len(checkouts))


@router.post(
    "/", response_model=ItemPublic, dependencies=[Depends(get_current_active_superuser)]
)
def create_item(*, session: SessionDep, item_in: ItemCreate) -> Any:
    """
    Create new item.
    """

    item = crud.get_item_by_name(session=session, name=item_in.name)
    if item:
        raise HTTPException(
            status_code=400,
            detail="The item with this name already exists in the system.",
        )
    try:
        item = crud.create_item(session=session, item_in=item_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return item


@router.put(
    "/{id}",
    response_model=ItemPublic,
    dependencies=[Depends(get_current_active_superuser)],
)
def update_item(*, session: SessionDep, id: int, item_in: ItemUpdate) -> Any:
    """
    Update an item.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item = crud.update_item(session=session, db_item=item, item_in=item_in)
    return item


@router.delete(
    "/{id}",
    response_model=Message,
    dependencies=[Depends(get_current_active_superuser)],
)
def delete_item(session: SessionDep, id: int) -> Message:
    """
    Delete an item.
    """
    item = session.get(Item, id)

    # Check if item is checked out anywhere
    checkouts = crud.get_checkouts_by_item_id(session=session, item_id=id)
    if checkouts:
        # Delete the checkouts_fusion first
        for checkout in checkouts.data:
            # Get the raw checkout object
            checkout = crud.get_checkout_by_id(session=session, id=checkout.id)
            crud.delete_checkout_request(session=session, db_checkout=checkout)

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return Message(message="Item deleted successfully")
