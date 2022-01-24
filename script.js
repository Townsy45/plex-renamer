console.clear();
import Prompts from 'prompts';
import Fs from 'fs';
import Ora from 'ora';
import Chalk from 'chalk';

const state = {};

const clearOnSubmit = { onSubmit: () => console.clear() };

(async () => {

  const response = await Prompts({
    type: 'select',
    name: 'type',
    message: Chalk.green('What are you looking to rename?\n'),
    choices: [
      {title: 'TV Show', value: 'tv'},
      {title: 'Movie', value: 'movie'}
    ],
  }, clearOnSubmit);

  if (response.type === 'tv') await handleTV();
  else if (response.type === 'film') await handleFilm();

})();

async function handleTV() {

  const { path } = await Prompts({
    type: 'text',
    name: 'path',
    message: Chalk.green('Where are the files located?\n')
  }, clearOnSubmit);


  // Check if the given path exists
  if (!await Fs.existsSync(path)) {
    return console.log(Chalk.red('An invalid path has been provided!'));
  }

  const fileLoader = Ora('Loading Files...').start();

  // Get all files from the directory
  const files = await Fs.readdirSync(path);

  // Stop the loader
  fileLoader.stop();

  // Display found files
  const { selectedFiles } = await Prompts({
    type: 'multiselect',
    name: 'selectedFiles',
    message: Chalk.green(`Found ${files.length} file(s), please select which you want to re-name!\n`),
    choices: files,
    min: 1
  }, clearOnSubmit);

  // Update the State with the files information
  state.files = selectedFiles.map(i => files[i]).map((f, i) => ({
    extension: f.substr(f.lastIndexOf('.'), f.length),
    original_name: f,
    possible_show_name: f.split('-')[0],
    index: i,
  }));

  // Run through the questions about the show and episode files
  state.show = await Prompts([
    {
      type: () => state.files[0]?.possible_show_name ? 'toggle' : null,
      name: 'name',
      message: Chalk.green(`Is this the correct show name?\n${state.files[0]?.possible_show_name}\n`),
      format: (value) => !value ? state.files[0]?.possible_show_name : null,
      initial: false,
      active: 'No',
      inactive: 'Yes'
    },
    {
      type: prev => prev ? null : 'text',
      name: 'name',
      message: Chalk.green('What is the name of the show?\n')
    },
    {
      type: 'number',
      name: 'season',
      message: Chalk.green('Which season is the file(s) part of?\n'),
      initial: 1,
      min: 1
    },
    {
      type: 'toggle',
      name: 'order',
      message: Chalk.green(`Are these in the correct order?\n\n${state.files.map((f, i) => Chalk.blue(`Episode ${i+1}: ${f.original_name}`)).join('\n')}\n\n`),
      format: (correct) => !correct ? Array.from({ length: state.files.length },(_, i)=>i) : false,
      initial: false,
      active: 'No',
      inactive: 'Yes'
    },
    ...state.files.map((f, i) => ({
      type: prev => !Array.isArray(prev) ? 'select' : null,
      name: `episode-${i}`,
      message: Chalk.green(`Please select the file to be used for Episode ${i+1}\n`),
      format: (value) => ({ episode: value, order: i }),
      choices: (prev, currValues) => state.files.map((f, i) => ({
        title: f.original_name,
        value: i,
        disabled: !!Object.entries(currValues).filter(([k]) => k.startsWith('episode-'))?.find(([,cv]) => cv?.episode === i)
      })),
      initial: prev => prev?.episode
    })),
  ], clearOnSubmit);

  if (!state.show.order) state.show.order = Object.entries(state.show)
    .filter(([k]) => k.startsWith('episode-'))
    .sort((o1, o2) => o1[1]?.order - o2[1]?.order)
    .map(([k, e]) => { delete state.show[k]; return e.episode });

  console.log('State', state)


  // C:\Users\Townsy\Desktop\Plex Processing\1 - RIPPING\BR\AGENTS\S2\D3





}

async function handleFilm() {


}
