// This file is auto-generated by @hey-api/openapi-ts

export type Body_listings_update_lease_agreement = {
  description?: string
}

export type Body_listings_update_listing_image = {
  is_primary?: boolean
  display_order?: number
}

export type Body_listings_upload_lease_agreement = {
  file: Blob | File
  description?: string
}

export type Body_listings_upload_listing_image = {
  file: Blob | File
  is_primary?: boolean
}

export type Body_login_login_access_token = {
  grant_type?: string | null
  username: string
  password: string
  scope?: string
  client_id?: string | null
  client_secret?: string | null
}

export type ConversationCreate = {
  name?: string | null
  is_group?: boolean
  participant_ids: Array<string>
}

export type ConversationParticipantPublic = {
  user_id: string
}

export type ConversationPublic = {
  name?: string | null
  is_group?: boolean
  id: string
  created_at: string
  last_message?: string | null
  last_message_time?: string | null
  unread_count?: number
  participants: Array<ConversationParticipantPublic>
}

export type ConversationsPublic = {
  data: Array<ConversationPublic>
  count: number
}

export type FAQCreate = {
  question: string
  answer?: string | null
}

export type FAQPublic = {
  question: string
  answer?: string | null
  id: string
  created_at: string
}

export type FAQsPublic = {
  data: Array<FAQPublic>
  count: number
}

export type FAQUpdate = {
  answer?: string | null
}

export type HTTPValidationError = {
  detail?: Array<ValidationError>
}

export type ImageFileType =
  | "image/jpeg"
  | "image/jpg"
  | "image/png"
  | "image/webp"
  | "image/gif"

export type ImagePublic = {
  filename: string
  file_path: string
  file_type: ImageFileType
  file_size: number
  is_primary?: boolean
  display_order?: number
  id: string
  listing_id: string
}

export type ItemCreate = {
  title: string
  description?: string | null
}

export type ItemPublic = {
  title: string
  description?: string | null
  id: string
  owner_id: string
}

export type ItemsPublic = {
  data: Array<ItemPublic>
  count: number
}

export type ItemUpdate = {
  title?: string | null
  description?: string | null
}

export type LeaseAgreementPublic = {
  filename: string
  file_path: string
  file_type: LeaseFileType
  file_size: number
  description?: string | null
  id: string
  listing_id: string
}

export type LeaseFileType = "application/pdf" | "text/plain"

export type ListingCreate = {
  num_bedrooms?: string | null
  num_bathrooms?: string | null
  address?: string | null
  realty_company?: string | null
  rent?: number | null
  included_utilities?: Array<string> | null
  security_deposit?: string | null
  amenities?: Array<string> | null
  lease_start_date?: string | null
  lease_end_date?: string | null
}

export type ListingPublic = {
  num_bedrooms?: string | null
  num_bathrooms?: string | null
  address?: string | null
  realty_company?: string | null
  rent?: number | null
  included_utilities?: Array<string> | null
  security_deposit?: string | null
  amenities?: Array<string> | null
  lease_start_date?: string | null
  lease_end_date?: string | null
  id: string
  owner_id: string
  images?: Array<{
    [key: string]: unknown
  }>
  lease_agreement?: {
    [key: string]: unknown
  }
}

export type ListingsPublic = {
  data: Array<ListingPublic>
  count: number
}

export type ListingUpdate = {
  num_bedrooms?: string | null
  num_bathrooms?: string | null
  address?: string | null
  realty_company?: string | null
  rent?: number | null
  included_utilities?: Array<string> | null
  security_deposit?: string | null
  amenities?: Array<string> | null
  lease_start_date?: string | null
  lease_end_date?: string | null
}

export type Message = {
  message: string
}

export type MessageCreate = {
  content: string
  conversation_id: string
}

export type MessagePublic = {
  content: string
  id: string
  sender_id: string
  conversation_id: string
  created_at: string
  updated_at?: string | null
  deleted: boolean
  read_by?: Array<ReadReceipt>
}

export type MessagesPublic = {
  data: Array<MessagePublic>
  count: number
}

export type MessageUpdate = {
  content?: string | null
}

export type NewPassword = {
  token: string
  new_password: string
}

export type PrivateUserCreate = {
  email: string
  password: string
  full_name: string
  is_verified?: boolean
}

export type PrivateUserCreateWithProfile = {
  email: string
  password: string
  full_name: string
  profile_type: string
  is_verified?: boolean
}

export type ReadReceipt = {
  user_id: string
  read_at: string
}

export type Token = {
  access_token: string
  token_type?: string
}

export type UpdatePassword = {
  current_password: string
  new_password: string
}

export type UpdatePin = {
  current_pin: string
  new_pin: string
}

export type UpdateSavedListings = {
  saved_listings: Array<string>
}

export type UserBlockCreate = {
  blocked_id: string
}

export type UserCreate = {
  email: string
  phone_number: string | null
  is_active?: boolean
  is_superuser?: boolean
  full_name?: string | null
  bio?: string | null
  profile_type?: string | null
  auto_logout?: number
  is_2fa_enabled?: boolean | null
  saved_listings?: Array<string>
  hasTakenRoommateQuiz?: boolean | null
  cleanScore?: number | null
  visitScore?: number | null
  sleepTime?: number | null
  pets?: number | null
  smoking?: number | null
  alcoholScore?: number | null
  password: string
}

export type UserPublic = {
  email: string
  phone_number: string | null
  is_active?: boolean
  is_superuser?: boolean
  full_name?: string | null
  bio?: string | null
  profile_type?: string | null
  auto_logout?: number
  is_2fa_enabled?: boolean | null
  saved_listings?: Array<string>
  hasTakenRoommateQuiz?: boolean | null
  cleanScore?: number | null
  visitScore?: number | null
  sleepTime?: number | null
  pets?: number | null
  smoking?: number | null
  alcoholScore?: number | null
  id: string
}

export type UserRegister = {
  email: string
  phone_number: string | null
  password: string
  full_name?: string | null
  auto_logout?: number
}

export type UsersPublic = {
  data: Array<UserPublic>
  count: number
}

export type UserUpdate = {
  email?: string | null
  phone_number: string | null
  is_active?: boolean
  is_superuser?: boolean
  full_name?: string | null
  bio?: string | null
  profile_type?: string | null
  auto_logout?: number | null
  is_2fa_enabled?: boolean | null
  saved_listings?: Array<string>
  hasTakenRoommateQuiz?: boolean | null
  cleanScore?: number | null
  visitScore?: number | null
  sleepTime?: number | null
  pets?: number | null
  smoking?: number | null
  alcoholScore?: number | null
  password?: string | null
  pin?: string | null
}

export type UserUpdateMe = {
  full_name?: string | null
  email?: string | null
  phone_number: string | null
  bio?: string | null
  profile_type?: string | null
  auto_logout?: number | null
  hasTakenRoommateQuiz?: boolean | null
  cleanScore?: number | null
  visitScore?: number | null
  sleepTime?: number | null
  pets?: number | null
  smoking?: number | null
  alcoholScore?: number | null
}

export type ValidationError = {
  loc: Array<string | number>
  msg: string
  type: string
}

export type FaqGetAllFaqsResponse = FAQsPublic

export type FaqCreateFaqData = {
  requestBody: FAQCreate
}

export type FaqCreateFaqResponse = FAQPublic

export type FaqGetFaqData = {
  faqId: string
}

export type FaqGetFaqResponse = FAQPublic

export type FaqUpdateFaqData = {
  faqId: string
  requestBody: FAQUpdate
}

export type FaqUpdateFaqResponse = FAQPublic

export type FaqDeleteFaqData = {
  faqId: string
}

export type FaqDeleteFaqResponse = {
  [key: string]: unknown
}

export type ItemsReadItemsData = {
  limit?: number
  skip?: number
}

export type ItemsReadItemsResponse = ItemsPublic

export type ItemsCreateItemData = {
  requestBody: ItemCreate
}

export type ItemsCreateItemResponse = ItemPublic

export type ItemsReadItemData = {
  id: string
}

export type ItemsReadItemResponse = ItemPublic

export type ItemsUpdateItemData = {
  id: string
  requestBody: ItemUpdate
}

export type ItemsUpdateItemResponse = ItemPublic

export type ItemsDeleteItemData = {
  id: string
}

export type ItemsDeleteItemResponse = Message

export type ListingsReadListingsData = {
  limit?: number
  skip?: number
}

export type ListingsReadListingsResponse = ListingsPublic

export type ListingsCreateListingData = {
  requestBody: ListingCreate
}

export type ListingsCreateListingResponse = ListingPublic

export type ListingsReadAllListingsData = {
  limit?: number
  skip?: number
}

export type ListingsReadAllListingsResponse = ListingsPublic

export type ListingsReadListingData = {
  id: string
}

export type ListingsReadListingResponse = ListingPublic

export type ListingsUpdateListingData = {
  id: string
  requestBody: ListingUpdate
}

export type ListingsUpdateListingResponse = ListingPublic

export type ListingsDeleteListingData = {
  id: string
}

export type ListingsDeleteListingResponse = Message

export type ListingsListingLikeEmailData = {
  email: string
}

export type ListingsListingLikeEmailResponse = Message

export type ListingsListingSaveEmailData = {
  email: string
}

export type ListingsListingSaveEmailResponse = Message

export type ListingsUploadListingImageData = {
  currentUser?: unknown
  formData: Body_listings_upload_listing_image
  listingId: string
}

export type ListingsUploadListingImageResponse = ImagePublic

export type ListingsDeleteListingImageData = {
  imageId: string
  listingId: string
}

export type ListingsDeleteListingImageResponse = unknown

export type ListingsUpdateListingImageData = {
  imageId: string
  listingId: string
  requestBody?: Body_listings_update_listing_image
}

export type ListingsUpdateListingImageResponse = ImagePublic

export type ListingsGetListingImagesData = {
  listingId: string
}

export type ListingsGetListingImagesResponse = Array<ImagePublic>

export type ListingsUploadLeaseAgreementData = {
  currentUser?: unknown
  formData: Body_listings_upload_lease_agreement
  listingId: string
}

export type ListingsUploadLeaseAgreementResponse = LeaseAgreementPublic

export type ListingsDeleteLeaseAgreementData = {
  agreementId: string
  currentUser?: unknown
  listingId: string
}

export type ListingsDeleteLeaseAgreementResponse = unknown

export type ListingsUpdateLeaseAgreementData = {
  agreementId: string
  currentUser?: unknown
  listingId: string
  requestBody?: Body_listings_update_lease_agreement
}

export type ListingsUpdateLeaseAgreementResponse = LeaseAgreementPublic

export type ListingsGetLeaseAgreementsData = {
  currentUser?: unknown
  listingId: string
}

export type ListingsGetLeaseAgreementsResponse = LeaseAgreementPublic

export type LoginLoginAccessTokenData = {
  formData: Body_login_login_access_token
}

export type LoginLoginAccessTokenResponse = Token

export type LoginLoginAccessTokenPinData = {
  email: string
  pin: string
}

export type LoginLoginAccessTokenPinResponse = Token

export type LoginTestTokenResponse = UserPublic

export type LoginRecoverPasswordData = {
  email: string
}

export type LoginRecoverPasswordResponse = Message

export type LoginResetPasswordData = {
  requestBody: NewPassword
}

export type LoginResetPasswordResponse = Message

export type LoginRecoverPasswordHtmlContentData = {
  email: string
}

export type LoginRecoverPasswordHtmlContentResponse = string

export type MessagesCreateConversationData = {
  requestBody: ConversationCreate
}

export type MessagesCreateConversationResponse = ConversationPublic

export type MessagesGetConversationsData = {
  limit?: number
  skip?: number
}

export type MessagesGetConversationsResponse = ConversationsPublic

export type MessagesCreateMessageData = {
  requestBody: MessageCreate
}

export type MessagesCreateMessageResponse = MessagePublic

export type MessagesUpdateMessageData = {
  messageId: string
  requestBody: MessageUpdate
}

export type MessagesUpdateMessageResponse = MessagePublic

export type MessagesDeleteMessageData = {
  messageId: string
}

export type MessagesDeleteMessageResponse = MessagePublic

export type MessagesGetConversationMessagesData = {
  conversationId: string
  includeDeleted?: boolean
  limit?: number
  skip?: number
}

export type MessagesGetConversationMessagesResponse = MessagesPublic

export type MessagesGetConversationByIdData = {
  conversationId: string
}

export type MessagesGetConversationByIdResponse = ConversationPublic

export type MessagesGetUnreadCountData = {
  /**
   * Filter by conversation
   */
  conversationId?: string
}

export type MessagesGetUnreadCountResponse = number

export type MessagesMarkMessageReadData = {
  messageId: string
}

export type MessagesMarkMessageReadResponse = boolean

export type MessagesMarkConversationReadData = {
  conversationId: string
}

export type MessagesMarkConversationReadResponse = number

export type MessagesBlockUserData = {
  requestBody: UserBlockCreate
}

export type MessagesBlockUserResponse = {
  [key: string]: unknown
}

export type MessagesUnblockUserData = {
  userId: string
}

export type MessagesUnblockUserResponse = boolean

export type MessagesGetBlockedUsersResponse = Array<string>

export type MessagesCheckUserBlockedData = {
  userId: string
}

export type MessagesCheckUserBlockedResponse = boolean

export type MessagesNewMessageEmailData = {
  email: string
  message: string
  senderName: string
}

export type MessagesNewMessageEmailResponse = Message

export type PrivateCreateUserData = {
  requestBody: PrivateUserCreate
}

export type PrivateCreateUserResponse = UserPublic

export type PrivateCreateUserWithProfileData = {
  requestBody: PrivateUserCreateWithProfile
}

export type PrivateCreateUserWithProfileResponse = UserPublic

export type UsersReadUsersData = {
  limit?: number
  skip?: number
}

export type UsersReadUsersResponse = UsersPublic

export type UsersCreateUserData = {
  requestBody: UserCreate
}

export type UsersCreateUserResponse = UserPublic

export type UsersReadRentersData = {
  limit?: number
  skip?: number
}

export type UsersReadRentersResponse = UsersPublic

export type UsersReadUserByEmailData = {
  email: string
}

export type UsersReadUserByEmailResponse = UserPublic

export type UsersReadUserMeResponse = UserPublic

export type UsersDeleteUserMeResponse = Message

export type UsersUpdateUserMeData = {
  requestBody: UserUpdateMe
}

export type UsersUpdateUserMeResponse = UserPublic

export type UsersUpdatePasswordMeData = {
  requestBody: UpdatePassword
}

export type UsersUpdatePasswordMeResponse = Message

export type UsersUpdateUserPinData = {
  requestBody: UpdatePin
}

export type UsersUpdateUserPinResponse = Message

export type UsersVerifyUserPinData = {
  pin: string
}

export type UsersVerifyUserPinResponse = Message

export type UsersRegisterUserData = {
  requestBody: UserRegister
}

export type UsersRegisterUserResponse = UserPublic

export type UsersReadUserByIdData = {
  userId: string
}

export type UsersReadUserByIdResponse = UserPublic

export type UsersUpdateUserData = {
  requestBody: UserUpdate
  userId: string
}

export type UsersUpdateUserResponse = UserPublic

export type UsersDeleteUserData = {
  userId: string
}

export type UsersDeleteUserResponse = Message

export type UsersUpdate2FaStatusData = {
  enabled: boolean
}

export type UsersUpdate2FaStatusResponse = UserPublic

export type UsersUpdateSavedListingsData = {
  requestBody: UpdateSavedListings
}

export type UsersUpdateSavedListingsResponse = UserPublic

export type UsersReadUserTutorialStatusResponse = {
  [key: string]: unknown
}

export type UsersCompleteProfileTutorialResponse = Message

export type UtilsTestEmailData = {
  emailTo: string
}

export type UtilsTestEmailResponse = Message

export type UtilsHealthCheckResponse = boolean
