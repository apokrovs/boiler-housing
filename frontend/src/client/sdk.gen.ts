// This file is auto-generated by @hey-api/openapi-ts

import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type {
  ItemsReadItemsData,
  ItemsReadItemsResponse,
  ItemsCreateItemData,
  ItemsCreateItemResponse,
  ItemsReadItemData,
  ItemsReadItemResponse,
  ItemsUpdateItemData,
  ItemsUpdateItemResponse,
  ItemsDeleteItemData,
  ItemsDeleteItemResponse,
  ListingsReadListingsData,
  ListingsReadAllListingsData,
  ListingsReadListingsResponse,
  ListingsReadAllListingsResponse,
  ListingsCreateListingData,
  ListingsCreateListingResponse,
  ListingsReadListingData,
  ListingsReadListingResponse,
  ListingsUpdateListingData,
  ListingsUpdateListingResponse,
  ListingsDeleteListingData,
  ListingsDeleteListingResponse,
  LoginLoginAccessTokenData,
  LoginLoginAccessTokenResponse,
  LoginLoginAccessTokenPinData,
  LoginLoginAccessTokenPinResponse,
  LoginTestTokenResponse,
  LoginRecoverPasswordData,
  LoginRecoverPasswordResponse,
  LoginResetPasswordData,
  LoginResetPasswordResponse,
  LoginRecoverPasswordHtmlContentData,
  LoginRecoverPasswordHtmlContentResponse,
  MessagesCreateConversationData,
  MessagesCreateConversationResponse,
  MessagesGetConversationsData,
  MessagesGetConversationsResponse,
  MessagesCreateMessageData,
  MessagesCreateMessageResponse,
  MessagesUpdateMessageData,
  MessagesUpdateMessageResponse,
  MessagesDeleteMessageData,
  MessagesDeleteMessageResponse,
  MessagesGetConversationMessagesData,
  MessagesGetConversationMessagesResponse,
  MessagesGetConversationByIdData,
  MessagesGetConversationByIdResponse,
  MessagesGetUnreadCountData,
  MessagesGetUnreadCountResponse,
  MessagesMarkMessageReadData,
  MessagesMarkMessageReadResponse,
  MessagesMarkConversationReadData,
  MessagesMarkConversationReadResponse,
  MessagesBlockUserData,
  MessagesBlockUserResponse,
  MessagesUnblockUserData,
  MessagesUnblockUserResponse,
  MessagesGetBlockedUsersResponse,
  MessagesCheckUserBlockedData,
  MessagesCheckUserBlockedResponse,
  PrivateCreateUserData,
  PrivateCreateUserResponse,
  UsersReadUsersData,
  UsersReadUsersResponse,
  UsersCreateUserData,
  UsersCreateUserResponse,
  UsersReadUserByEmailData,
  UsersReadUserByEmailResponse,
  UsersReadUserMeResponse,
  UsersDeleteUserMeResponse,
  UsersUpdateUserMeData,
  UsersUpdateUserMeResponse,
  UsersUpdatePasswordMeData,
  UsersUpdatePasswordMeResponse,
  UsersUpdateUserPinData,
  UsersUpdateUserPinResponse,
  UsersVerifyUserPinData,
  UsersVerifyUserPinResponse,
  UsersRegisterUserData,
  UsersRegisterUserResponse,
  UsersReadUserByIdData,
  UsersReadUserByIdResponse,
  UsersUpdateUserData,
  UsersUpdateUserResponse,
  UsersDeleteUserData,
  UsersDeleteUserResponse,
  UsersUpdate2FaStatusData,
  UsersUpdate2FaStatusResponse,
  UtilsTestEmailData,
  UtilsTestEmailResponse,
  UtilsHealthCheckResponse,
} from "./types.gen"

export class ItemsService {
  /**
   * Read Items
   * Retrieve items.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns ItemsPublic Successful Response
   * @throws ApiError
   */
  public static readItems(
    data: ItemsReadItemsData = {},
  ): CancelablePromise<ItemsReadItemsResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/items/",
      query: {
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Create Item
   * Create new item.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns ItemPublic Successful Response
   * @throws ApiError
   */
  public static createItem(
    data: ItemsCreateItemData,
  ): CancelablePromise<ItemsCreateItemResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/items/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Item
   * Get item by ID.
   * @param data The data for the request.
   * @param data.id
   * @returns ItemPublic Successful Response
   * @throws ApiError
   */
  public static readItem(
    data: ItemsReadItemData,
  ): CancelablePromise<ItemsReadItemResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/items/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Item
   * Update an item.
   * @param data The data for the request.
   * @param data.id
   * @param data.requestBody
   * @returns ItemPublic Successful Response
   * @throws ApiError
   */
  public static updateItem(
    data: ItemsUpdateItemData,
  ): CancelablePromise<ItemsUpdateItemResponse> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/items/{id}",
      path: {
        id: data.id,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Item
   * Delete an item.
   * @param data The data for the request.
   * @param data.id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteItem(
    data: ItemsDeleteItemData,
  ): CancelablePromise<ItemsDeleteItemResponse> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/items/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}

export class ListingsService {
  /**
   * Read Listings
   * Retrieve listings.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns ListingsPublic Successful Response
   * @throws ApiError
   */
  public static readListings(
    data: ListingsReadListingsData = {},
  ): CancelablePromise<ListingsReadListingsResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/listings/",
      query: {
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
  /**
   * Read Listings
   * Retrieve listings.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns ListingsPublic Successful Response
   * @throws ApiError
   */
  public static readAllListings(
    data: ListingsReadAllListingsData = {},
  ): CancelablePromise<ListingsReadAllListingsResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/listings/",
      query: {
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Create Listing
   * Create new listing.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns ListingPublic Successful Response
   * @throws ApiError
   */
  public static createListing(
    data: ListingsCreateListingData,
  ): CancelablePromise<ListingsCreateListingResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/listings/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read Listing
   * Get listing by ID.
   * @param data The data for the request.
   * @param data.id
   * @returns ListingPublic Successful Response
   * @throws ApiError
   */
  public static readListing(
    data: ListingsReadListingData,
  ): CancelablePromise<ListingsReadListingResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/listings/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Listing
   * Update a listing.
   * @param data The data for the request.
   * @param data.id
   * @param data.requestBody
   * @returns ListingPublic Successful Response
   * @throws ApiError
   */
  public static updateListing(
    data: ListingsUpdateListingData,
  ): CancelablePromise<ListingsUpdateListingResponse> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/listings/{id}",
      path: {
        id: data.id,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Listing
   * Delete a listing.
   * @param data The data for the request.
   * @param data.id
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteListing(
    data: ListingsDeleteListingData,
  ): CancelablePromise<ListingsDeleteListingResponse> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/listings/{id}",
      path: {
        id: data.id,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}

export class LoginService {
  /**
   * Login Access Token
   * OAuth2 compatible token login, get an access token for future requests
   * @param data The data for the request.
   * @param data.formData
   * @returns Token Successful Response
   * @throws ApiError
   */
  public static loginAccessToken(
    data: LoginLoginAccessTokenData,
  ): CancelablePromise<LoginLoginAccessTokenResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/login/access-token",
      formData: data.formData,
      mediaType: "application/x-www-form-urlencoded",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Login Access Token Pin
   * PIN-based login, get an access token for future requests
   * @param data The data for the request.
   * @param data.email
   * @param data.pin
   * @returns Token Successful Response
   * @throws ApiError
   */
  public static loginAccessTokenPin(
    data: LoginLoginAccessTokenPinData,
  ): CancelablePromise<LoginLoginAccessTokenPinResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/login/access-token-pin",
      query: {
        email: data.email,
        pin: data.pin,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Test Token
   * Test access token
   * @returns UserPublic Successful Response
   * @throws ApiError
   */
  public static testToken(): CancelablePromise<LoginTestTokenResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/login/test-token",
    })
  }

  /**
   * Recover Password
   * Password Recovery
   * @param data The data for the request.
   * @param data.email
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static recoverPassword(
    data: LoginRecoverPasswordData,
  ): CancelablePromise<LoginRecoverPasswordResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/password-recovery/{email}",
      path: {
        email: data.email,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Reset Password
   * Reset password
   * @param data The data for the request.
   * @param data.requestBody
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static resetPassword(
    data: LoginResetPasswordData,
  ): CancelablePromise<LoginResetPasswordResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/reset-password/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Recover Password Html Content
   * HTML Content for Password Recovery
   * @param data The data for the request.
   * @param data.email
   * @returns string Successful Response
   * @throws ApiError
   */
  public static recoverPasswordHtmlContent(
    data: LoginRecoverPasswordHtmlContentData,
  ): CancelablePromise<LoginRecoverPasswordHtmlContentResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/password-recovery-html-content/{email}",
      path: {
        email: data.email,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}

export class MessagesService {
  /**
   * Create Conversation
   * Create a new conversation.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns ConversationPublic Successful Response
   * @throws ApiError
   */
  public static createConversation(
    data: MessagesCreateConversationData,
  ): CancelablePromise<MessagesCreateConversationResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/messages/conversations",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Get Conversations
   * Get all conversations for the current user.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns ConversationsPublic Successful Response
   * @throws ApiError
   */
  public static getConversations(
    data: MessagesGetConversationsData = {},
  ): CancelablePromise<MessagesGetConversationsResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/messages/conversations",
      query: {
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Create Message
   * Create a new message.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns MessagePublic Successful Response
   * @throws ApiError
   */
  public static createMessage(
    data: MessagesCreateMessageData,
  ): CancelablePromise<MessagesCreateMessageResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/messages/messages",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Message
   * Update a message.
   * @param data The data for the request.
   * @param data.messageId
   * @param data.requestBody
   * @returns MessagePublic Successful Response
   * @throws ApiError
   */
  public static updateMessage(
    data: MessagesUpdateMessageData,
  ): CancelablePromise<MessagesUpdateMessageResponse> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/messages/messages/{message_id}",
      path: {
        message_id: data.messageId,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete Message
   * Delete a message.
   * @param data The data for the request.
   * @param data.messageId
   * @returns MessagePublic Successful Response
   * @throws ApiError
   */
  public static deleteMessage(
    data: MessagesDeleteMessageData,
  ): CancelablePromise<MessagesDeleteMessageResponse> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/messages/messages/{message_id}",
      path: {
        message_id: data.messageId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Get Conversation Messages
   * Get messages for a specific conversation.
   * @param data The data for the request.
   * @param data.conversationId
   * @param data.skip
   * @param data.limit
   * @param data.includeDeleted
   * @returns MessagesPublic Successful Response
   * @throws ApiError
   */
  public static getConversationMessages(
    data: MessagesGetConversationMessagesData,
  ): CancelablePromise<MessagesGetConversationMessagesResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/messages/conversations/{conversation_id}/messages",
      path: {
        conversation_id: data.conversationId,
      },
      query: {
        skip: data.skip,
        limit: data.limit,
        include_deleted: data.includeDeleted,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Get Conversation By Id
   * Get a specific conversation by id.
   * @param data The data for the request.
   * @param data.conversationId
   * @returns ConversationPublic Successful Response
   * @throws ApiError
   */
  public static getConversationById(
    data: MessagesGetConversationByIdData,
  ): CancelablePromise<MessagesGetConversationByIdResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/messages/conversations/{conversation_id}",
      path: {
        conversation_id: data.conversationId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Get Unread Count
   * Get count of unread messages for the current user.
   * @param data The data for the request.
   * @param data.conversationId Filter by conversation
   * @returns number Successful Response
   * @throws ApiError
   */
  public static getUnreadCount(
    data: MessagesGetUnreadCountData = {},
  ): CancelablePromise<MessagesGetUnreadCountResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/messages/unread",
      query: {
        conversation_id: data.conversationId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Mark Message Read
   * Mark a message as read.
   * @param data The data for the request.
   * @param data.messageId
   * @returns boolean Successful Response
   * @throws ApiError
   */
  public static markMessageRead(
    data: MessagesMarkMessageReadData,
  ): CancelablePromise<MessagesMarkMessageReadResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/messages/messages/{message_id}/read",
      path: {
        message_id: data.messageId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Mark Conversation Read
   * Mark all messages in a conversation as read.
   * @param data The data for the request.
   * @param data.conversationId
   * @returns number Successful Response
   * @throws ApiError
   */
  public static markConversationRead(
    data: MessagesMarkConversationReadData,
  ): CancelablePromise<MessagesMarkConversationReadResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/messages/conversations/{conversation_id}/read",
      path: {
        conversation_id: data.conversationId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Block User
   * Block a user.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns unknown Successful Response
   * @throws ApiError
   */
  public static blockUser(
    data: MessagesBlockUserData,
  ): CancelablePromise<MessagesBlockUserResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/messages/users/block",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Unblock User
   * Unblock a user.
   * @param data The data for the request.
   * @param data.userId
   * @returns boolean Successful Response
   * @throws ApiError
   */
  public static unblockUser(
    data: MessagesUnblockUserData,
  ): CancelablePromise<MessagesUnblockUserResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/messages/users/{user_id}/unblock",
      path: {
        user_id: data.userId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Get Blocked Users
   * Get all users blocked by the current user.
   * @returns string Successful Response
   * @throws ApiError
   */
  public static getBlockedUsers(): CancelablePromise<MessagesGetBlockedUsersResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/messages/users/blocked",
    })
  }

  /**
   * Check User Blocked
   * Check if a user is blocked by the current user or has blocked the current user.
   * @param data The data for the request.
   * @param data.userId
   * @returns boolean Successful Response
   * @throws ApiError
   */
  public static checkUserBlocked(
    data: MessagesCheckUserBlockedData,
  ): CancelablePromise<MessagesCheckUserBlockedResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/messages/users/{user_id}/blocked",
      path: {
        user_id: data.userId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}

export class PrivateService {
  /**
   * Create User
   * Create a new user.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns UserPublic Successful Response
   * @throws ApiError
   */
  public static createUser(
    data: PrivateCreateUserData,
  ): CancelablePromise<PrivateCreateUserResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/private/users/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }
}

export class UsersService {
  /**
   * Read Users
   * Retrieve users.
   * @param data The data for the request.
   * @param data.skip
   * @param data.limit
   * @returns UsersPublic Successful Response
   * @throws ApiError
   */
  public static readUsers(
    data: UsersReadUsersData = {},
  ): CancelablePromise<UsersReadUsersResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/",
      query: {
        skip: data.skip,
        limit: data.limit,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Create User
   * Create new user.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns UserPublic Successful Response
   * @throws ApiError
   */
  public static createUser(
    data: UsersCreateUserData,
  ): CancelablePromise<UsersCreateUserResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/users/",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read User By Email
   * Get a specific user by email.
   * @param data The data for the request.
   * @param data.email
   * @returns UserPublic Successful Response
   * @throws ApiError
   */
  public static readUserByEmail(
    data: UsersReadUserByEmailData,
  ): CancelablePromise<UsersReadUserByEmailResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/by-email/{email}",
      path: {
        email: data.email,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read User Me
   * Get current user.
   * @returns UserPublic Successful Response
   * @throws ApiError
   */
  public static readUserMe(): CancelablePromise<UsersReadUserMeResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/me",
    })
  }

  /**
   * Delete User Me
   * Delete own user.
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteUserMe(): CancelablePromise<UsersDeleteUserMeResponse> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/users/me",
    })
  }

  /**
   * Update User Me
   * Update own user.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns UserPublic Successful Response
   * @throws ApiError
   */
  public static updateUserMe(
    data: UsersUpdateUserMeData,
  ): CancelablePromise<UsersUpdateUserMeResponse> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/users/me",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update Password Me
   * Update own password.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static updatePasswordMe(
    data: UsersUpdatePasswordMeData,
  ): CancelablePromise<UsersUpdatePasswordMeResponse> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/users/me/password",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update User Pin
   * Set or update the user's PIN.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static updateUserPin(
    data: UsersUpdateUserPinData,
  ): CancelablePromise<UsersUpdateUserPinResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/users/me/pin",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Verify User Pin
   * Verify the user's PIN.
   * @param data The data for the request.
   * @param data.pin
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static verifyUserPin(
    data: UsersVerifyUserPinData,
  ): CancelablePromise<UsersVerifyUserPinResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/users/me/verify-pin",
      query: {
        pin: data.pin,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Register User
   * Create new user without the need to be logged in.
   * @param data The data for the request.
   * @param data.requestBody
   * @returns UserPublic Successful Response
   * @throws ApiError
   */
  public static registerUser(
    data: UsersRegisterUserData,
  ): CancelablePromise<UsersRegisterUserResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/users/signup",
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Read User By Id
   * Get a specific user by id.
   * @param data The data for the request.
   * @param data.userId
   * @returns UserPublic Successful Response
   * @throws ApiError
   */
  public static readUserById(
    data: UsersReadUserByIdData,
  ): CancelablePromise<UsersReadUserByIdResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/by-id/{user_id}",
      path: {
        user_id: data.userId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update User
   * Update a user.
   * @param data The data for the request.
   * @param data.userId
   * @param data.requestBody
   * @returns UserPublic Successful Response
   * @throws ApiError
   */
  public static updateUser(
    data: UsersUpdateUserData,
  ): CancelablePromise<UsersUpdateUserResponse> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/users/{user_id}",
      path: {
        user_id: data.userId,
      },
      body: data.requestBody,
      mediaType: "application/json",
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Delete User
   * Delete a user.
   * @param data The data for the request.
   * @param data.userId
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteUser(
    data: UsersDeleteUserData,
  ): CancelablePromise<UsersDeleteUserResponse> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/users/{user_id}",
      path: {
        user_id: data.userId,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Update 2Fa Status
   * Enable or disable two-factor authentication for the current user.
   * @param data The data for the request.
   * @param data.enabled
   * @returns UserPublic Successful Response
   * @throws ApiError
   */
  public static update2FaStatus(
    data: UsersUpdate2FaStatusData,
  ): CancelablePromise<UsersUpdate2FaStatusResponse> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/users/me/2fa",
      query: {
        enabled: data.enabled,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }
}

export class UtilsService {
  /**
   * Test Email
   * Test emails.
   * @param data The data for the request.
   * @param data.emailTo
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static testEmail(
    data: UtilsTestEmailData,
  ): CancelablePromise<UtilsTestEmailResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/utils/test-email/",
      query: {
        email_to: data.emailTo,
      },
      errors: {
        422: "Validation Error",
      },
    })
  }

  /**
   * Health Check
   * @returns boolean Successful Response
   * @throws ApiError
   */
  public static healthCheck(): CancelablePromise<UtilsHealthCheckResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/utils/health-check/",
    })
  }
}
