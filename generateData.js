import * as fs from 'fs';
import { parseFile } from './utils/monkeySharkDataProcessor.js';
import {countWordsFromFile} from './utils/totalLexicalPicture.js'
import path from 'path';

const outputFolderPath = './src/processedData';

async function generateData({ txtInput }) {
  try {
    // Generate output file name by adding "Processed" to the input file name
    const inputFileName = path.basename(txtInput, '.txt');  // Get file name without extension
    const outputFileName = `${inputFileName}.json`;  // Add "Processed" before the extension

    const outputFilePath = path.join(outputFolderPath, outputFileName);

    // Check if the file already exists and delete it before creating a new one
    if (fs.existsSync(outputFilePath)) {
      fs.unlinkSync(outputFilePath);  // Delete the file
      console.log(`File ${outputFileName} already exists. It has been deleted.`);
    }

    // Parse the file
    const { albums, songs } = parseFile(txtInput);

    // Prepare data to write to a file
    const dataToWrite = {
      albums: Array.from(albums.values()).map((album) => ({
        name: album.name,
        releaseDate: album.releaseDate,
        songs: Array.from(album.songs.values()).map((song) =>song.title),
      })),
      songs: Array.from(songs.values()).map((song) => ({
        title: song.title,
        text: song.text,
        releaseDate: song.releaseDate,
        albums: Array.from(song.albums.values()).map(album => ({
          name: album.name,
          releaseDate: album.releaseDate,
        })),
      })),
    };

    // Write the parsed data to a JSON file
    fs.writeFileSync(outputFilePath, JSON.stringify(dataToWrite, null, 2));

    console.log(`Data has been successfully written to ${outputFilePath}`);
  } catch (error) {
    console.error('Error generating data:', error);
  }
}

// generateData({ txtInput: './src/data/OELyricsTest.txt' });
// await countWordsFromFile('./src/processedData/OELyricsTest.json')

generateData({ txtInput: './src/data/OELyrics.txt' });
await countWordsFromFile('./src/processedData/OELyrics.json')


