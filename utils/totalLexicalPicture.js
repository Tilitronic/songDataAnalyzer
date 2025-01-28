import * as fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';


async function lemmatize(wordCountMap) {
  return new Promise((resolve, reject) => {
    const process = spawn('python', ['./utils/lemmatize.py']);
    process.stdin.write(JSON.stringify(Array.from(wordCountMap.entries())));
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
    for (const song of jsonData.songs) {
      const songWordCountMap = new Map();
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

      const sortedLemmatizedSongWordCountObj = Object.fromEntries(sortedLemmatizedSongWordCountMap)
      wordBySong[song.title] = {
        words: sortedLemmatizedSongWordCountObj,
        totalWordsQuantity: Object.keys(sortedLemmatizedSongWordCountObj).length,
        uniqueWordsCount: Object.values(sortedLemmatizedSongWordCountObj).reduce((sum, value) => sum + value, 0)
      };
      // console.log('lemmatizedSongWordCountMap', lemmatizedSongWordCountMap);
      sortedLemmatizedSongWordCountMap.forEach((value, key) => {
        // console.log('value, key', key, value);
        // console.log('totalWordCountMap.get(key)', totalWordCountMap.get(key));
        totalWordCountMap.set(key, (totalWordCountMap.get(key) || 0) + value)
      })
    }

    const albums = {}

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
      wordCountBySong: wordBySong
    }

    fs.writeFileSync(outputFilePath, JSON.stringify(dataToWrite, null, 2));
    // return sortedTotalWordMap;
  } catch (error) {
    console.error('Error reading or processing the file:', error);
  }
}
