---
id: start
title: Start here
states:
  - home
  - eee321-rotating-loop?p=ex71c
  - eee321-rotating-loop?p=ex71c&VB=100
  - plane-wave-incidence
  - eee321-armature-winding?p=lap16
---

Field Lab is a set of online labs for the courses EEE 361 and EEE 321. You change a value, the field or the machine responds at once, and you read the same numbers that you get by hand.

This guide shows how to use the site. It does not teach the physics. For the physics, use **Show the work**, the guided experiments and your textbook.

> Every page ends with the same note: the labs are a student project, not an official course resource. Check your results against the textbook.

## Open a lab

![The home page: the title Field Lab, a How to use button and the theme choice at the top right, two course chips, and lab tiles grouped under EEE 361 and EEE 321.](home-desktop)

1. **[ui:How to use]** opens this guide.
2. The course chips jump to the labs of one course.
3. Each tile is one lab. Click anywhere on the tile, or on **[ui:Open lab]**. Tiles with a dashed border are planned labs; they do not open yet.
4. The theme choice: **[ui:Auto]** follows your device, **[ui:Light]** and **[ui:Dark]** fix the colours.

Each lab has its own address. The browser's back button takes you back to the list of labs.

## The screen

On a computer, every lab has the same layout.

![The rotating-loop lab on a computer: a header with the back button, the controls column on the left, the machine drawing in the centre with plots below it, and the results column on the right.](layout-desktop)

1. **[ui:Field Lab]** takes you back to the list of labs.
2. The controls: presets, sliders and choices. The guided experiments are in this column too. It scrolls on its own.
3. The simulation: the drawing of the field, the transformer or the machine.
4. The results: every computed value, with its symbol from the textbook. This column also scrolls on its own.
5. Plots, the "what changed" sentence and **Show the work** are below the simulation. Scroll the centre column to see them.
6. **[ui:Guide]** opens this guide at the section for this lab. Next to it are **[ui:Copy link]** and the theme choice.

On a phone, or in a narrow window, the simulation stays at the top and the rest is in tabs.

![The rotating-loop lab on a phone: the playback buttons and the machine drawing at the top, a row of tabs below it, and the Controls tab open underneath.](layout-phone)

1. The pinned view: the playback buttons and the simulation. It stays on screen while you scroll.
2. The tabs: **[ui:Controls]**, **[ui:Results]**, **[ui:Explain]** and, in most labs, **[ui:Plots]**. The armature lab has a **[ui:Diagram]** tab and an **[ui:Exam]** tab instead of **Plots**.
3. The open tab. The guided experiments and **Show the work** are in **Explain**.

## Common controls

### Sliders and number fields

![Two sliders, battery voltage and resistance, each with its number field on the right.](ctl-slider)

1. The number field. Click it, type a value and press Enter. Press Escape to cancel.
2. The slider. Drag it, or click it and use the arrow keys.

You can type units and prefixes, as on a calculator: `13.8 kV`, `4.7k`, `2.4 GHz`, `250 mT`. The speed field of the armature lab also accepts `50 rev/s` and `400 rpm`. If the lab cannot read what you typed, the field turns red and the old value stays. A value outside the range of the slider is set to the nearest end, or the lab tells you why it cannot use it.

### Presets and choices

![The Setup section: a preset list marked customized, and a two-part choice between shaft torque and shaft speed.](ctl-preset)

1. A preset loads the data of a textbook example or problem.
2. **[ui:customized]** appears as soon as you change a value of the preset. To get the preset's values back, choose another preset and then this one again.
3. A segmented choice. The dark part is the selected option.

A switch, such as **[ui:Rays]** or **[ui:Advanced]**, is on when its knob is dark and on the right. A crossed-out option cannot be chosen now; point at it to see why.

### The toolbar and playback

![The toolbar of the plane-wave lab: the choice of wave, the field, the polarization, the Rays switch, and the playback buttons with the speed list.](ctl-toolbar)

1. A segmented choice of what the drawing shows. It changes the picture only.
2. A switch.
3. Play and pause.
4. Step: one small step forward in time. It pauses the animation.
5. Reset: back to $t = 0$.
6. The speed of the animation.

The animation is slowed down. The caption under the drawing says by how much. The numbers never depend on the animation speed. If your device asks for reduced motion, the animation starts paused; press play to start it.

### The header

![The right end of a lab header: the Guide button, the Copy link button and the theme choice.](ctl-header)

1. **[ui:Guide]** opens this guide at the section for this lab.
2. **[ui:Copy link]** copies the page address. The address holds the whole setup, so anyone who opens it sees your exact values. You can also bookmark it.
3. The theme choice.

On a phone, **Copy link** and the theme choice are not in the header. Share the address from the browser menu, and change the theme on the home page.

## The teaching layer

### What changed

![The What is happening panel: a sentence with a coloured bar that explains the last change, and three sentences about the situation now.](teach-what)

1. After each change, a sentence with a coloured bar on its left says what changed and why.
2. The sentences below it describe the situation now.

You find this panel under the plots, with the heading **[ui:What is happening]**.

### Show the work

![Show the work, opened: the first step with its title, its section number on the right, and three lines of mathematics.](teach-work)

1. Click **[ui:Show the work: equation, numbers, result]** to open it. Click again to close it.
2. Each step has a title. On the right is its textbook section or equation number.
3. The first line is the equation, as in the textbook.
4. The second line is the same equation with your numbers and units.
5. The last line is the result.

The steps follow the order of a written exam answer. They change at once when you change an input. Some steps have only one or two lines, for example a definition.

### Guided experiments

![One guided experiment, opened: its number and title, a task, the question after Predict first, a Show the answer button and a Set up this experiment button.](teach-experiment)

1. Click an experiment to open it. Each lab has six or seven, under **[ui:Guided experiments]**.
2. Read the task and the question after **Predict first**. Decide your answer before you go on.
3. **[ui:Show the answer]** shows the answer. Some answers have a button that moves the lab to the answer.
4. **[ui:Set up this experiment]** sets the controls to the starting point of the experiment.

An experiment whose answer you have seen shows **[ui:✓ done]**. The mark lasts until you reload the page.

## Keyboard

- Tab and Shift+Tab move between the controls. A dark outline shows where you are.
- Enter or Space presses the button or the switch with the outline.
- The arrow keys move a slider. Some drawings work like sliders too: the incident ray and the reflection plot in the plane-wave lab, and the operating line in the rotating-loop lab.
- In a number field, Enter accepts the value and Escape cancels it.
