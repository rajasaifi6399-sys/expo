import ExpoModulesCore
import Photos
import UniformTypeIdentifiers

class Album : SharedObject {
  let id: String
  var collection: PHAssetCollection?
  private let context: AppContext
  
  init(id: String, context: AppContext) {
    self.id = id
    self.context = context
  }
  
  func getCollection() async throws -> PHAssetCollection {
    try await fetchAlbumIfNeeded()
    return collection!
  }
 
  // TODO: Caching assets
  func getAssets() async throws -> [Asset] {
    try await fetchAlbumIfNeeded()
    let phAssets = AssetRepository.shared.get(by: collection!)
    return phAssets.map { Asset(id: $0.localIdentifier, context: context) }
  }
  
  func name() async throws -> String {
      try await fetchAlbumIfNeeded()
      guard let title = collection?.localizedTitle else {
          throw FailedToGetPropertyException("")
      }
      return title
  }
  
  func delete(deleteAssets: Bool = false) async throws {
    try await fetchAlbumIfNeeded()
    try await CollectionRepository.shared.delete(by: [collection!], deleteAssets: deleteAssets)
  }
  
  private func fetchAlbumIfNeeded() async throws {
    if self.collection != nil {
        return
    }
    
    let options = PHFetchOptions()
    options.includeHiddenAssets = true
    options.fetchLimit = 1
    
    let fetchResult = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [self.id], options: options)
    guard let fetchedAlbum = fetchResult.firstObject else {
        throw Exception()
    }
    
    self.collection = fetchedAlbum
  }
}
