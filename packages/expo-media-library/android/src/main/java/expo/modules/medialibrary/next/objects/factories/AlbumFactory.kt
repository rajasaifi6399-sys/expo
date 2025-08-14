package expo.modules.medialibrary.next.objects.factories

import android.content.Context
import android.media.MediaScannerConnection
import android.os.Environment
import expo.modules.kotlin.exception.Exceptions.ReactContextLost
import expo.modules.medialibrary.UnableToLoadException
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumId
import expo.modules.medialibrary.next.objects.Album
import expo.modules.medialibrary.next.objects.Asset
import java.io.IOException

class AlbumFactory(private val context: Context) {
  private val contentResolver get() = context.contentResolver ?: throw ReactContextLost()

  fun createFromAssets(
    name: String,
    assets: List<Asset>,
    move: Boolean
  ): Album {
    try {
      val relativePath = buildRelativePath("DCIM", name)
      val processedAssets = processAssetsLocation(assets, relativePath, move)
      refreshMediaStoreVisibility(processedAssets)
      val albumId = contentResolver.queryAlbumId(relativePath)
        ?: throw IOException("Could not find album with relativePath: $relativePath")
      return Album(albumId, context)
    } catch (e: SecurityException) {
      throw UnableToLoadException("Missing WRITE_EXTERNAL_STORAGE permission: ${e.message}", e)
    } catch (e: IOException) {
      throw UnableToLoadException("I/O error while creating album: ${e.message}", e)
    }
  }

  fun createFromFilePaths(name: String, filePaths: List<String>, assetFactory: AssetFactory): Album {
    val relativePath = buildRelativePath("DCIM", name)
    filePaths.forEach { filePath ->
      assetFactory.create(filePath, relativePath)
    }
    val albumId = contentResolver.queryAlbumId(relativePath)
      ?: throw IOException("Could not find album with relativePath: $relativePath")
    return Album(albumId, context)
  }

  private fun getRelativePathForAssetType(mimeType: String?, useCameraDir: Boolean): String {
    if (mimeType?.contains("image") == true || mimeType?.contains("video") == true) {
      return if (useCameraDir) Environment.DIRECTORY_DCIM else Environment.DIRECTORY_PICTURES
    } else if (mimeType?.contains("audio") == true) {
      return Environment.DIRECTORY_MUSIC
    }
    // For backward compatibility
    return if (useCameraDir) Environment.DIRECTORY_DCIM else Environment.DIRECTORY_PICTURES
  }

  private fun buildRelativePath(rootDirectory: String, albumName: String): String =
    "$rootDirectory/$albumName/"

  private fun processAssetsLocation(
    assets: List<Asset>,
    targetRelativePath: String,
    move: Boolean
  ): List<Asset> = when (move) {
    true -> assets.map { it.move(targetRelativePath) }
    false -> assets.map { it.copy(targetRelativePath) }
  }

  private fun refreshMediaStoreVisibility(assets: List<Asset>) {
    val uris = assets.map { it.contentUri.toString() }.toTypedArray()
    MediaScannerConnection.scanFile(context, uris, null) { _, _ -> /* no-op callback */ }
  }
}
