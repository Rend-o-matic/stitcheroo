# Stitcheroo

Stitch all of your videos into a lovely big video wall.

## Description

Stitcheroo was created as part of the [Choirless project](https://github.com/choirless).

Stitcheroo is a module that takes a list of video filepaths and then combines them together using FFMPEG to output a single video with all the source videos next to each other. The generated video is then return as a buffer.

## Usage

### Example

```javascript
const sticheroo = require('stitcheroo');
const fs = require('fs');

const videosToCombine = [`${__dirname}/vid_1.mp4`, `${__dirname}/vid_2.mp4`, `${__dirname}/vid_3.mp4`]

stitcheroo(videosToCombine, true)
    .then(data => {

        // Data is a buffer with the generated video contained within.
        // Once the buffer is created, no file persists on the system
        // so we'll write it to a file here, but you can do what you
        // like with it.

        fs.writeFileSync('written_output.mp4', data);

    })
    .catch(err => {
        console.log('Err:', err);
    })
;

stitcheroo(videosToCombine, false)
    .then(data => {

        console.log(data) // Will be a path to the rendered file instead.

    })
    .catch(err => {
        console.log('Err:', err);
    })
;

```

## Stitcheroo Arguments

### stitcheroo(`[VIDEO FILE PATHS ARRAY]`, [RETURN AS BUFFER BOOLEAN])

#### VIDEO FILE PATHS

This is an array of file paths pointing to the videos you'd like to combine. The videos passed will be proportionately scaled to fit within a 1920x1080 pixel container (HD video dimensions) and centered both horizontally and vertically.

#### RETURN AS BUFFER
Default: true

The default behaviour of stitcheroo is to return a buffer of the rendered video. However, if you wish, you can pass `false` as an argument and the path to the rendered file will be returned instead. 

## Output

![An animated GIF of the kind of output you can expect](output.gif)