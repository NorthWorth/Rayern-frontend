// Single source of truth for the product
// version and the short "What's New" list.
// Bump APP_VERSION and prepend a new entry
// (latest first) when shipping a release.
export const APP_VERSION = '0.5.0-mvp'

export const WHATS_NEW = [
  {
    version: '0.5.0-mvp',
    items: [
      'Documents are here: upload, search, rename, download, and delete files that persist in your workspace.',
      'Notifications now work end to end with an unread badge and mark-as-read.',
      'Meetings are paused for the MVP and marked as Coming Soon.',
    ],
  },
]
