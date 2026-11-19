---
id: faq
title: Questions and problems
states:
  - eee321-armature-winding?p=lap16&C=18
  - eee321-armature-winding?p=ex73
  - eee321-rotating-loop?p=ex71c
  - eee321-three-phase-transformer?p=r212
---

### The diagram says it cannot be drawn.

The armature lab draws a winding only if no commutator segment is ever under two brushes, and only up to $C = 48$. Frog-leg windings are never drawn. The message says the reason. Press **[ui:Go to nearest drawable (C = 16)]** (the value depends on your winding) or, for a large winding, **[ui:Show a small drawable version (C = 48)]**. The numbers in the results are exact for any value, drawn or not. See [Drawable values of C](#/guide#eee321-armature-winding-drawable-values-of-c).

![A message in place of the diagram: a lap winding needs C to be a multiple of mP, with a button to go to the nearest drawable value.](arm-notdrawn)

1. The reason.
2. The button that moves to the nearest drawable value.

### My answer differs from the solutions manual.

First check that you entered the data of the problem exactly. Then:

- The solutions manual has errors in Problems 2-10 to 2-13 of the transformer lab. The lab shows a note under **What is happening** for each of these presets. Follow the book's equations.
- The book often rounds in the middle of a calculation. The lab keeps every digit until the end, so the last digit of a result can differ.
- Look at **Show the work**: it shows each equation with your numbers, so you can find the step where your answer and the lab's answer part.

### How do I reset everything?

The reset button in the toolbar resets only the time. To reset the setup, choose a preset again, or open the lab from the home page. A lab address without anything after the lab's name, such as [the rotating loop](#/eee321-rotating-loop), opens the lab's starting setup.

### How do I share my setup with a friend?

Press **[ui:Copy link]** and send the link. The address holds every value, so your friend sees exactly your setup. On a phone, share the address from the browser menu.

### Why do the numbers not change when I move some controls?

Some controls change the picture only:

- **[ui:pole-arc fraction (drawing only)]** in the rotating loop: the numbers use $A_P = \pi r l$, without gaps.
- The drop gain of the per-phase phasor diagram and **[ui:Show circuit referred to]** in the transformer lab's real bank.
- The third-harmonic amplitude $h$ in the transformer lab.
- The weak-field colour scale in the plane-wave lab, and the animation speed in every lab.

### A value turned red, or the lab did not accept it.

- The field turns red when the lab cannot read what you typed. Type a number, with a unit if you like, and press Enter.
- A value outside a slider's range is set to the nearest end.
- Some values are refused with a message: a wattmeter reading above $V \cdot I$, a load torque above the starting torque of the loop, or a negative speed.

### What does "beyond the textbook" mean?

The lab computes something that your course textbook does not treat, for example oblique incidence on a lossy medium, or the pitch of a multiplex wave winding. Use these results with care in an exam.

### The animation does not move.

Press play. If your device asks for reduced motion, every animation starts paused.

### Where are the controls on my phone?

In the tabs under the pinned view: **[ui:Controls]**, **[ui:Results]**, **[ui:Explain]**, and **[ui:Plots]** or the lab's own tabs. See [The screen](#/guide#start-the-screen).
