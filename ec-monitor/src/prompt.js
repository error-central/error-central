const inquirer = require('inquirer');
const path = require('path');
const debug = require('./utils/tabtabDebug')('tabtab:prompt');
const chalk = require('chalk');

/**
 * Asks user about SHELL and desired location.
 *
 * It is too difficult to check spawned SHELL, the user has to use chsh before
 * it is reflected in process.env.SHELL
 */
const prompt = () => {
  const ask = inquirer.createPromptModule();

  console.log('🐛' + chalk.white.bold(' Thank you for installing Error Central! ') + '🐛')
  console.log()
  console.log('To capture errors, we need to install a script that runs each session.')

  const questions = [
    {
      type: 'list',
      name: 'shell',
      message: 'Which shell do you use ?',
      choices: ['bash', 'zsh', 'fish'],
      default: 'bash'
    }
  ];

  const locations = {
    bash: '~/.bashrc',
    zsh: '~/.zshrc',
    fish: '~/.config/fish/config.fish'
  };

  const finalAnswers = {};

  return ask(questions)
    .then(answers => {
      const { shell } = answers;
      debug('answers', shell);

      let location = locations[shell];

      // HACK: On MacOS (darwin) .bashrc isn't run by default
      if (shell == 'bash' && process.platform == 'darwin') {
        location = '~/.bash_profile';
      }

      debug(`Will install error-central to ${location}`);

      Object.assign(finalAnswers, { location, shell });
      return location;
    })
    .then(location =>
      ask({
        type: 'confirm',
        name: 'locationOK',
        message: `We will error-central monitoring to ${location}, is it ok ?`
      })
    )
    .then(answers => {
      const { locationOK } = answers;
      if (locationOK) {
        debug('location is ok, return', finalAnswers);
        return finalAnswers;
      }

      // otherwise, ask for specific **absolute** path
      return ask({
        name: 'userLocation',
        message: 'Which path then ? Must be absolute.',
        validate: input => {
          debug('Validating input', input);
          return path.isAbsolute(input);
        }
      }).then(lastAnswer => {
        const { userLocation } = lastAnswer;
        console.log(`Very well, we will install using ${userLocation}`);
        Object.assign(finalAnswers, { location: userLocation });

        return finalAnswers;
      });
    });
};

module.exports = prompt;
