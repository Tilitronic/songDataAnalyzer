import * as fs from 'fs';

class Song {
  constructor({title, releaseDate, album}) {
    // console.log("Constructing song", title)
    this.title = title.trim();
    this.releaseDate = releaseDate.trim();
    this.albums = new Map();
    this.text = '';
    this.addAlbum(album)
  }

  addAlbum(album) {
    // console.log("Adding album", album.name, "to song", this.title )
    if (!this.albums.has(album.name)) {
      this.albums.set(album.name, album);
    }
  }

  appendText(line) {
    // Check if line includes "приспів" followed by only allowed characters
    const pattern = /приспів[\s:()\d]*$/i;
    if (line && !pattern.test(line)) {
      this.text += line + '\n';
    }
  }
}

class Album {
  constructor(name, releaseDate) {
    this.name = name.trim();
    this.releaseDate = releaseDate.trim();
    this.songs = new Map();
  }

  addSong(song) {
    // console.log("Adding song", song.title, "to album", this.name)
    if (!this.songs.has(song.title)) {
      this.songs.set(song.title, song);
      song.addAlbum(this);
    }
  }
}

export function parseFile(filePath) {
  // console.log("Parsing started")
  const albums = new Map();
  const songs = new Map();

  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  let currentSong = null;
  let currentAlbum = null;

  lines.forEach(line => {
    line = line.trim();

    const isLineAlbumName = line.startsWith('@');
    const isLineSongName = line.startsWith('#');
    const isLineLyricsRow = !isLineAlbumName && !isLineSongName;

    if (isLineAlbumName) {
      // Parsing album
      const albumMatch = line.match( /@(.+)\s\(/);
      // console.log('albumMatch', albumMatch);
      if (albumMatch) {
        const albumName = albumMatch[1];
        const releaseYear = line.match(/\(([^()]+)\)$/)[1];

        // console.log("Parsing album", albumName)
        if (albumName && releaseYear) {
          // Create new album and store in Map
          currentAlbum = new Album(albumName, releaseYear);
          albums.set(albumName, currentAlbum);
        } else {
          console.log("Something is very wrong");
        }
      }
    } else if (isLineSongName) {
      // Parsing song
      const songMatch = line.match(/^# (.+)$/);
      if (songMatch && currentAlbum) {
        const songName = songMatch[1];
        // console.log("Parsing song", songName)

        const isInSongs = songs.has(songName);

        if (songName && !isInSongs) {
          // console.log("The song is new")
          currentSong = new Song({title: songName, releaseDate: currentAlbum.releaseDate, album: currentAlbum});
          songs.set(songName, currentSong);
          currentAlbum.addSong(currentSong);
        }else if (songMatch && isInSongs){
          songs.get(songName).addAlbum(currentAlbum);
          currentAlbum.addSong(currentSong);
        }
        else {
          console.log("Something is very wrong");
        }
      }
    } else if (isLineLyricsRow && currentAlbum && currentSong) {
      // Append song text if we are continuing the song
      currentSong.appendText(line);
      // console.log(`Appending line "${line}" to song "${currentSong.title}"`)
    }
  });

  return { albums, songs };
}
