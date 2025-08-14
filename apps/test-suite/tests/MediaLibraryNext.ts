import { Asset as A } from 'expo-asset';
import { Asset, Album } from 'expo-media-library/next';
import { create } from 'lodash';
import { Platform } from 'react-native';

export const name = 'MediaLibrary@Next';

const FILES = [
  require('../assets/icons/app.png'),
  require('../assets/icons/loading.png'),
  require('../assets/black-128x256.png'),
  require('../assets/qrcode_expo.jpg'),
  require('../assets/big_buck_bunny.mp4'),
];

const MP3_FILES = [require('../assets/LLizard.mp3')];

const ALBUM_NAME = 'ALBUM_NAME';

export async function test(t) {
  let files;
  let mp3Files;
  let jpgFile;
  let pngFile;
  let mp4File;
  let webmFile;
  let mp3File;
  let differentFileTypes;
  t.beforeAll(async () => {
    files = await A.loadAsync(FILES);
    mp3Files = await A.loadAsync(MP3_FILES);
    pngFile = files[0];
    jpgFile = files[3];
    mp4File = files[4];
    webmFile = files[5];
    mp3File = mp3Files[0];
    differentFileTypes = [pngFile, jpgFile, mp4File, webmFile, mp3File];
  });

  let albumsContainer = [];
  let assetsContainer = [];

  t.afterAll(async () => {
    await Album.deleteMany(albumsContainer.flat(), true);
    await Asset.deleteMany(assetsContainer.flat());
    albumsContainer = [];
    assetsContainer = [];
  });

  t.describe('Album creation', async () => {
    t.it('creates an album from a list of paths', async () => {
      const album_name = createAlbumName('creates an album from a list of paths');
      const album = await Album.create(
        album_name,
        files.map((file) => file.localUri)
      );
      albumsContainer.push(album);

      const assets = await album.getAssets();
      t.expect(assets.length).toBe(files.length);
      t.expect(await album.getName()).toBe(album_name);
    });
    t.it('creates an album from a list of assets', async () => {
      const assets = await Promise.all(files.map((file) => Asset.create(file.localUri)));
      for (let asset of assets) {
        assetsContainer.push(asset);
      }
      let album_name = createAlbumName('creates an album from a list of assets');
      const album = await Album.create(album_name, assets);
      albumsContainer.push(album);
      t.expect(assets.length).toBe(files.length);
      t.expect(await album.getName()).toBe(album_name);
    });
    t.it('should not create album with audio and image', async () => {
      try {
        const album_name = createAlbumName('should not create album with audio and image');
        const album = await Album.create(
          album_name,
          differentFileTypes.map((file) => file.localUri)
        );
        albumsContainer.push(album);
        t.fail();
      } catch (e) {
        t.expect(e).not.toBe(null);
      }
    });
  });
  t.describe('Asset creation', async () => {
    t.it('creates a png asset', async () => {
      // when
      let asset = await Asset.create(pngFile.localUri);
      assetsContainer.push(asset);
      // then
      t.expect(asset.id).not.toBe(null);
    });
    if (Platform.OS === 'ios') {
      t.it('throws error on creating a mp3 asset', async () => {
        // when
        try {
          let asset = await asset.create(mp3file.localuri);
          assetscontainer.push(asset);
          t.fail();
        } catch (e) {
          t.expect(e).not.tobe(null);
        }
      });
    } else {
      t.it('creates a mp3 asset', async () => {
        let asset = await Asset.create(mp3File.localUri);
        assetsContainer.push(asset);
        t.expect(asset.id).not.toBe(null);
      });
    }
    t.it('creates a mp4 asset', async () => {
      // when
      let asset = await Asset.create(mp4File.localUri);
      assetsContainer.push(asset);
      // then
      t.expect(asset.id).not.toBe(null);
    });
    t.it('creates a jpg asset', async () => {
      // when
      let asset = await Asset.create(jpgFile.localUri);
      assetsContainer.push(asset);
      // then
      t.expect(asset.id).not.toBe(null);
    });
    t.it('creates an asset inside an album', async () => {
      // given
      let album_name = createAlbumName('creates an asset inside an album');
      let assetToCreateAlbum = await Asset.create(files[0].localUri);
      assetsContainer.push(assetToCreateAlbum);
      let album = await Album.create(album_name, [assetToCreateAlbum]);
      albumsContainer.push(album);
      // when
      let newAsset = await Asset.create(files[1].localUri, album);
      assetsContainer.push(newAsset);
      // then
      t.expect(newAsset.id).not.toBe(null);
      const assets = await album.getAssets();
      const expectedIds = assets.map((asset) => asset.id);
      t.expect(expectedIds.includes(assetToCreateAlbum.id));
      t.expect(expectedIds.includes(newAsset.id));
    });
  });
  t.describe('Album deletion', async () => {
    t.it('deletes an album', async () => {
      let album_name = createAlbumName('deletes an album');
      const album = await Album.create(album_name, [files[0].localUri], true);
      albumsContainer.push(album);
      let assets = await album.getAssets();
      t.expect(assets.length).toBe(1);
      await album.delete();
      const deletedAlbum = new Album(album.id);
      try {
        await deletedAlbum.getName();
        t.fail();
      } catch (e) {
        t.expect(e).not.toBe(null);
      }
    });
  });
  function createAlbumName(name: string) {
    return name.replaceAll(' ', '_');
  }
}
