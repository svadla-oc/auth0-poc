FilesUpload = new FS.Collection('filesUpload', {
  stores: [
    new FS.Store.GridFS('filesUpload'),
  ]
});

function isOwner(userId, file) {
  return true;
}

FilesUpload.allow({
  insert: isOwner,
  update: isOwner,
  remove: isOwner,
  download() { return true; },
  fetch: ['userId'],
});

