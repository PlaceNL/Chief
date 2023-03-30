# Creating a client -  Priority mappings

During r/place, certain areas may be more important to defend than others. For example, artwork may be considered
more important to defend than a flag. For these cases, you need a system to define which areas are important, and which
areas aren't. Luckily, Chief has such a system. Orders can have a second image, defining the importance of the pixels.
It is documented below.

> **Note:** If your client supports priority mappings, it should enable the `priorityMappings` capability.
> For more information about the capabilities system, see the [protocol guide](../client/PROTOCOL.md).

## Quick facts

- Orders *can* have a priority mapping, but **aren't required to**.
- Priority mapping image always has the same size as the order image.
- R, G, and B values decide the importance of a pixel.
- Pixels without artwork on the order image are ignored.
- After calculating priorities, pixels should be shuffled
  using [a weighted shuffle](http://utopia.duth.gr/~pefraimi/research/data/2007EncOfAlg.pdf).

## Implementation

If an order has a priority mapping, it will have a `priority` link in the `images` section of the order.

> **Note:** A common mistake when loading images to a canvas-like buffer is forgetting to 'clear' the existing buffer
> before pasting in the new image. If you don't do this, pixels that existed in a previous version of the template (but
> are now transparent), may end up getting included accidentally.

First, determine which pixels on the canvas don't match up with the template. Then, for these pixels, get the R, G, B,
and alpha values of the same pixel on the priority mapping image.

If the alpha value is `0` (and only then), the priority should also be considered 0.
If it isn't, you should continue calculating the priority like specified below.

First, take the R value and shift it 16 bits to the left. Then, shift the B value 8 bits to the left and add it onto the
shifted R value. Finally, add the B value without shifting it. If done correctly, this means you'll get values
between `0` and `16777215`.

An example implementation in Javascript of this calculation can be found below:

```javascript
if (alpha === 0) {
    return 0;
}
return (r << 16) + (g << 8) + b;
```

Now that you've calculated the priorities of the pixels, you should add the coordinates to an array and perform
[a weighted shuffle](http://utopia.duth.gr/~pefraimi/research/data/2007EncOfAlg.pdf) ([JavaScript implementation can be found on npm](https://www.npmjs.com/package/weighted-shuffle)),
where the priority is the weight. Then, grab the first pixel and place it like you normally would.

## Useful references

- [Priority color calculator tool](https://toolbox.placenl.nl/priority)
- [Weighted Random Sampling (2005; Efraimidis, Spirakis)](http://utopia.duth.gr/~pefraimi/research/data/2007EncOfAlg.pdf)
