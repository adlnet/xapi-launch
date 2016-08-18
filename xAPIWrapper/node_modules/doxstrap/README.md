# DoxStrap

JavaScript documentation generator based on JSDoc syntax, Dox parser, Twitter Bootstrap CSS, and Prism syntax highlighter.

## Installation

    npm install -g doxstrap

## Usage

Parse the JSDoc in all source files in `src/**/*.js`, and write the output to the `doc` folder:

    doxstrap --title "My Docs" --output doc

## Local

You can also install it local to your project:

    npm install doxstrap --save-dev

    ./node_modules/doxstrap/bin/doxstrap.js --title "My Docs" --output doc
