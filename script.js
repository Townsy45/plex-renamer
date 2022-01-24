// Clear the console when first running
console.clear();
// Require all dependencies
import Prompts from 'prompts';
import Fs from 'fs';
import Ora from 'ora';
import Chalk from 'chalk';
// Create a blank state to store all information about the process
const state = {};
// Options object for Prompts that clears the terminal after each question submission
const clearOnSubmit = { onSubmit: () => console.clear() };

// Main IIFE Function
(async () => {

  // Ask the user to pick between TV or Movie Renaming
  const response = await Prompts({
    type: 'select',
    name: 'type',
    message: Chalk.green('What are you looking to rename?\n'),
    choices: [
      {title: 'TV Show', value: 'tv'},
      {title: 'Movie', value: 'movie'}
    ],
  }, clearOnSubmit);

  // Call the handlers for the selected format
  if (response.type === 'tv') await handleTV();
  else if (response.type === 'film') await handleFilm();

})();


// Handle TV Series Renaming
async function handleTV() {

  // Ask the user for the file path of the files
  const { path } = await Prompts({
    type: 'text',
    name: 'path',
    message: Chalk.green('Where are the files located?\n')
  }, clearOnSubmit);

  // Check if the given path exists and return if not
  if (!await Fs.existsSync(path)) return console.log(Chalk.red('An invalid path has been provided!'));

  // Start a loader while getting all files (This should never run but here in case there is lots of files.)
  const fileLoader = Ora('Loading Files...').start();

  // Get all files from the directory
  const files = await Fs.readdirSync(path);

  // Stop the loader
  fileLoader.stop();

  // Display found files and select which ones they want to use
  const { selectedFiles } = await Prompts({
    type: 'multiselect',
    name: 'selectedFiles',
    message: Chalk.green(`Found ${files.length} file(s), please select which you want to re-name!\n`),
    choices: files,
    min: 1
  }, clearOnSubmit);

  // Update the State with the files information
  state.files = selectedFiles.map(i => files[i]).map((f, i) => ({
    extension: f.substr(f.lastIndexOf('.'), f.length), // .mkv
    original_name: f, // Marvel's Agents Of S.H.I.E.L.D.- Season 2 (Disc 3)_t00.mkv
    possible_show_name: f.split('-')[0], // Marvel's Agents Of S.H.I.E.L.D.
    index: i, // 0
  }));

  // Run through the questions about the show and episode files
  state.show = await Prompts([
    // Take a guess at the title based on filename, and ask the user if they should use it or not.
    {
      type: () => state.files[0]?.possible_show_name ? 'toggle' : null,
      name: 'name',
      message: Chalk.green(`Is this the correct show name?\n${state.files[0]?.possible_show_name}\n`),
      format: (value) => !value ? state.files[0]?.possible_show_name : null,
      initial: false,
      active: 'No',
      inactive: 'Yes'
    },
    // If NOT then ask for a free input of the title
    {
      type: prev => prev ? null : 'text',
      name: 'name',
      message: Chalk.green('What is the name of the show?\n')
    },
    // Get the season number to apply to the files
    {
      type: 'number',
      name: 'season',
      message: Chalk.green('Which season is the file(s) part of?\n'),
      initial: 1,
      min: 1
    },
    // Ask if they are in the correct order (yes/no)
    {
      type: 'toggle',
      name: 'order',
      message: Chalk.green(`Are these in the correct order?\n\n${state.files.map((f, i) => Chalk.blue(`Episode ${i+1}: ${f.original_name}`)).join('\n')}\n\n`),
      format: (correct) => !correct ? Array.from({ length: state.files.length },(_, i)=>i) : false,
      initial: false,
      active: 'No',
      inactive: 'Yes'
    },
    // If NOT in order Ask to select episode for every episode file in order
    ...state.files.map((f, i) => ({
      type: prev => !Array.isArray(prev) ? 'select' : null,
      name: `episode-${i}`,
      message: Chalk.green(`Please select the file to be used for Episode ${i+1}\n`),
      format: (value) => ({ episode: value, order: i }),
      choices: (prev, currValues) => state.files.map((f, i) => ({
        title: f.original_name,
        value: i,
        // Disable if the episode has already been picked and is in the show object
        disabled: !!Object.entries(currValues).filter(([k]) => k.startsWith('episode-'))?.find(([,cv]) => cv?.episode === i)
      })),
      // Set this to start on the previously selected episode so it's seamless
      // TODO - Idea to move to the next available be that up or down an index, checking for start and end of the array.
      initial: prev => prev?.episode
    })),
  ], clearOnSubmit);

  // Remove all the episode keys from the results of the questions as its a limit of the prompts system.
  //  Remove episode key and add the episode index to the order array in the correct order.
  if (!state.show.order) state.show.order = Object.entries(state.show)
    .filter(([k]) => k.startsWith('episode-'))
    .sort((o1, o2) => o1[1]?.order - o2[1]?.order)
    .map(([k, e]) => { delete state.show[k]; return e.episode });


  // TODO - Add a question to confirm new order
  // TODO - Move file selector and order check to a new looping function so you can loop make changes if need be.


  // Temp, log the state after all questions
  console.log('State', state)

}


// Handle Movie File Renaming
async function handleFilm() {

  // TODO - Work on adding film re-namer

}
