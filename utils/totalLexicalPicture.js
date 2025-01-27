import * as fs from 'fs';
import { spawn } from 'child_process';


async function lemmatize(word) {
  console.log("Started lemmatizing of", word);

  return new Promise((resolve, reject) => {
    const process = spawn('python', ['./utils/lemmatize.py', word]);

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
        resolve(output.trim());
      } else {
        reject(`Python script exited with code ${code}`);
      }
    });
  });
}

export async  function countWordsFromFile(filePath) {
  console.log("Let's count all the words");

  try {
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

      words.forEach(word=>songWordCountMap.set(word, (songWordCountMap.get(word) || 0) + 1))
      const sortedSongMap = new Map([...songWordCountMap.entries()].sort((a, b) => b[1] - a[1]));
      console.log(Array.from(sortedSongMap.entries()));

      const lemmatizedSongWordCountMap = new Map();
      for (const [key, value] of songWordCountMap) {
        const lemmatizedKey = await lemmatize(key);
        const lemtValue = lemmatizedSongWordCountMap.get(lemmatizedKey) || 0;
        lemmatizedSongWordCountMap.set(lemmatizedKey, lemtValue + value)
      }

      wordBySong[song.title] = lemmatizedSongWordCountMap;
      lemmatizedSongWordCountMap.forEach((key, value) => totalWordCountMap.set(key, (totalWordCountMap.get(key) || 0) + value))
    }

    // Convert Map to an array and log the results
    total
    const sortedWordMap = new Map([...totalWordCountMap.entries()].sort((a, b) => b[1] - a[1]));
    console.log(Array.from(sortedWordMap.entries()));
    return sortedWordMap;
  } catch (error) {
    console.error('Error reading or processing the file:', error);
  }
}
