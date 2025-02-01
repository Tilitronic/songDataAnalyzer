import * as fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { sharpLibraryMusic } from '@quasar/extras/material-icons-sharp';


async function lemmatize(wordCountMapOrArray) {
  return new Promise((resolve, reject) => {
    const process = spawn('python', ['./utils/lemmatize.py']);
    if(map instanceof Map){
      process.stdin.write(JSON.stringify(Array.from(wordCountMapOrArray.entries())));
    } else if(Array.isArray(wordCountMapOrArray)){
      process.stdin.write(JSON.stringify(wordCountMapOrArray));
    }
    else{
      console.warn("ERROR: in the function lemmatize only Map or Array can be provided, so it return Array, not a NULL, as it will return now! ")
      return null
    }

    process.stdin.end();

    let output = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      reject(`stderr: ${data.toString()}`);
    });

    process.on('error', (error) => {
      reject(`Error: ${error.message}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(new Map(Object.entries(JSON.parse(output.trim()))));
      } else {
        reject(`Python script exited with code ${code}`);
      }
    });
  });
}

const outputFolderPath = './src/processedData';

export async  function countWordsFromFile(filePath) {
  console.log("Let's count all the words");

  try {
    const inputFileName = path.basename(filePath, '.json');
    const outputFileName = `${inputFileName}WordCount.json`;

    const outputFilePath = path.join(outputFolderPath, outputFileName);

    if (fs.existsSync(outputFilePath)) {
          fs.unlinkSync(outputFilePath);  // Delete the file
          console.log(`File ${outputFileName} already exists. It has been deleted.`);
    }
    // Read and parse the JSON file
    const data = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(data);

    // Ensure we have songs in the JSON
    if (!jsonData.songs || !Array.isArray(jsonData.songs)) {
      console.error("Invalid JSON structure: missing 'songs' array.");
      return;
    }



    // Use a for...of loop to handle async operations properly
    const totalWordCountMap = new Map();
    const wordBySong = {};
    const songsMap = new Map();
    for (const song of jsonData.songs) {
      const songWordCountMap = new Map();
      songsMap.set(song.title, song)
      // Extract text and normalize it
      const words = song.text
        .toLowerCase()  // Convert to lowercase
        .replace(/[!.:,?"–]/g, '')  // Remove punctuation
        .split(/\s+/);  // Split by whitespace

      console.log("--------------"+song.title+"--------------");
      // console.log('words', words);

      words.forEach(word=> {
        if(word) {
          return songWordCountMap.set(word, (songWordCountMap.get(word) || 0) + 1)        }
       })

      // console.log('songWordCountMap', songWordCountMap);
      // const sortedSongMap = new Map([...songWordCountMap.entries()].sort((a, b) => b[1] - a[1]));
      // console.log(Array.from(sortedSongMap.entries()));

      const lemmatizedSongWordCountMap = await lemmatize(songWordCountMap);
      console.log('lemmatizedSongWordCountMap', lemmatizedSongWordCountMap);
      // console.log('lemmatizedSongWordCountMap', lemmatizedSongWordCountMap);

      const sortedLemmatizedSongWordCountMap = new Map([...lemmatizedSongWordCountMap.entries()].sort((a, b) => b[1] - a[1]));
      // console.log(song.title)
      // console.log(Array.from(sortedLemmatizedSongWordCountMap.entries()));

      // for (const [key, value] of songWordCountMap) {
      //   const lemmatizedKey = await lemmatize(key);
      //   const lemtValue = lemmatizedSongWordCountMap.get(lemmatizedKey) || 0;
      //   lemmatizedSongWordCountMap.set(lemmatizedKey, lemtValue + value)
      // }

      const sortedLemmatizedSongWordCountObj = Object.fromEntries(sortedLemmatizedSongWordCountMap);

      const totalWordsQuantity = Object.keys(sortedLemmatizedSongWordCountObj).length;
      const uniqueWordsCount = Object.values(sortedLemmatizedSongWordCountObj).reduce((sum, value) => sum + value, 0);

      wordBySong[song.title] = {
        words: sortedLemmatizedSongWordCountObj,
        totalWordsQuantity: totalWordsQuantity,
        uniqueWordsCount: uniqueWordsCount,
        lexicalUniquenessPercent: (uniqueWordsCount*100) / totalWordsQuantity
      };
      // console.log('lemmatizedSongWordCountMap', lemmatizedSongWordCountMap);
      sortedLemmatizedSongWordCountMap.forEach((value, key) => {
        // console.log('value, key', key, value);
        // console.log('totalWordCountMap.get(key)', totalWordCountMap.get(key));
        totalWordCountMap.set(key, (totalWordCountMap.get(key) || 0) + value)
      })
    }

    const wordByAlbum = {};
    for (const album in jsonData.albums){
      wordByAlbum[album.name] = {};
      const albumObj = wordByAlbum[album.name];
      albumObj.name = album.name;
      albumObj.releaseDate = album.releaseDate;
      albumObj.songsQuantity = album.songs.length;
      albumObj.originalSongsQuantity = album.songs.reduce((count, songTitle) => {
        const songReleaseDate = songsMap.get(songTitle)?.releaseDate;
        if(!songReleaseDate) console.warn("For some reason the song listed in the albums pool is ont in the songs pool")
        return songsMap.get(song)?.releaseDate === album.releaseDate ? count + 1 : count;
      }, 0);
      albumObj.originalityPercent = (songsQuantity * 100) / albumObj.originalSongsQuantity
      albumObj.words = (async()=>{
        const songWordCountMap = new Map();
        for(const songTitle of album.songs){
          const songObj = songsMap.get(songTitle);
          const songWordCountMap = await lemmatize(songObj.text+songWordCountMap);
        }
        //rewrite album statistics
        // album.songs.forEach((songTitle)=>{


        //   //finish it
        // })

        return wordsMap
      })()

      // ()=>{
      //   const albumWordCountMap = new Map();

      //   return albumWordCountMap
      // })()


    }



    // for (const album of jsonData.albums){

    //   albums[album.name] = {
    //     releaseDate: album.releaseDate
    //   }

    // }

    // Convert Map to an array and log the results
    const sortedTotalWordMap = new Map([...totalWordCountMap.entries()].sort((a, b) => b[1] - a[1]));
    console.log(Array.from(sortedTotalWordMap.entries()));

    const totalWordCountObj = Object.fromEntries(sortedTotalWordMap);

    const dataToWrite = {
      totalWordCount: totalWordCountObj,
      wordCountBySong: wordBySong,
      wordCountByAlbum: wordByAlbum
    }

    fs.writeFileSync(outputFilePath, JSON.stringify(dataToWrite, null, 2));
    // return sortedTotalWordMap;
  } catch (error) {
    console.error('Error reading or processing the file:', error);
  }
}
