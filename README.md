# gcode-sort
Optimize a GCODE file by reducing the total time spent moving the bit (G0) vs cutting or carving (G1)

### Before
<img width="420" alt="image" src="https://user-images.githubusercontent.com/461650/157695751-132d20a5-4069-4051-b000-a22d99c1a722.png">

### After
<img width="420" alt="image" src="https://user-images.githubusercontent.com/461650/157695986-250068b5-5fd4-486a-b55f-09b6dad2f581.png">

## Features
 - should work with gcode from [Easel](https://easel.inventables.com/)
 - fast optimization using the [2-opt algorithm](https://en.wikipedia.org/wiki/2-opt) that is commonly used for solving the [Traveling Salesman Problem](https://en.wikipedia.org/wiki/Travelling_salesman_problem).
 - option to show/hide travel/cutting/z changes.
 - reports what you save (in term of total distance)
 - download the optimized file

## Known issues
 - hard-coded work area of 512x512

## Bugs? Issues?
If you encounter a bug or have a gcode file that wasn't handled properly, please create an issue with the relevant file attached and I will take a look at it.

## Want to contribute? Request a feature?
Any help is appreciated. Send in a PR or reach out to me.

## Thanks
Thank to @pedrohfsd for his javascript version of the 2-opt algorithm. I used it because it was easy to understand and adapt.
