---
id: eee321-armature-winding
title: Armature windings and $E_A$
states:
  - eee321-armature-winding?p=lap16
  - eee321-armature-winding?p=lap16&C=18
  - eee321-armature-winding?p=p72
  - eee321-armature-winding?p=ex73
---

## What this lab shows

Lap, wave and frog-leg windings of a DC machine. The lab draws the developed winding diagram, traces the parallel paths through it, and computes $Z$, $a$, $y_c$, $E_A$, $R_A$ and $I_A$ with the equations. It has an exam mode (Chapman § 7.3, 7.5).

## Quick start

1. Open the lab. It starts with **[ui:Simplex lap, 16 coils, 4 poles (book Fig. 7-15)]**.
2. Point at the first path chip above the diagram. The coils of that path turn magenta.
3. Press **[ui:Wave]**. The lab changes the number of coils to a value it can draw and says so under **What is happening**.
4. Scroll the centre column to the exam mode, or open the **[ui:Exam]** tab on a phone, and identify a winding.

## The screen

![The armature lab on a computer: winding choices and the number of coils on the left, path chips and the developed winding diagram in the centre, and the results on the right.](lab-arm-desktop)

1. **[ui:Preset (Chapman)]**: Examples 7-2 to 7-4, Problems 7-2 and 7-7, and the book's two figure windings.
2. The winding: **[ui:Lap]**, **[ui:Wave]** or **[ui:Frog-leg]**; **[ui:simplex]**, **[ui:duplex]** or **[ui:triplex]**; **[ui:progressive]** or **[ui:retrogressive]**; and the number of poles $P$.
3. $C$, the number of coils (equal to the number of commutator segments), with its − and + buttons and the **[ui:Drawable:]** chips.
4. The path chips: one chip per parallel path, with its voltage.
5. The developed winding diagram, as in the exam: poles on the strip at the top, slots, coils, commutator segments and brushes. The rotor slides to the left past the fixed poles and brushes.
6. The results: the winding numbers, the poles and the dead zone, the constants and speed, and the voltage and current.

Below the diagram you find **[ui:End view]**, **[ui:Parallel paths]** (one row per path, with the voltage of each coil), **[ui:Brush voltage against rotor angle]**, **What is happening**, the exam mode and **Show the work**.

![The armature lab on a phone: playback buttons and the end view of the machine at the top, with the tabs Controls, Results, Diagram, Explain and Exam below.](lab-arm-phone)

## Enter a textbook problem

### Choose a winding

Press the choice buttons in the **[ui:Winding]** section. The lab keeps your choice and changes as few other values as it must to reach a winding it can draw: first $P$ (only when nothing else works), then $C$ to the nearest drawable value, then the coil span $y_s$ back to full pitch. The "what changed" sentence lists every change and its reason. A value that you type is never changed.

### Highlight a parallel path

![The developed diagram with Path 1 highlighted: the path chips above the diagram, and the coils of the first path drawn in magenta.](arm-path)

1. Point at a path chip with the mouse, or tap it on a phone.
2. The coils of that path turn magenta. For this winding there are $a$ = {{arm.lap16.a: 4}} paths, as Eq. (7-26) gives for a simplex lap winding with four poles.

The **[ui:Parallel paths]** schematic below the diagram lists the same paths, with the voltage of each coil.

### Drawable values of $C$

![The coils control: the C field and slider, the minus and plus buttons, and the chips of drawable values.](arm-c)

1. $C$. Type any value: the numbers are always computed. The slider stops only on values that can be drawn.
2. − and + step to the previous or next drawable value.
3. The **[ui:Drawable:]** chips: click one to use it.

A winding can be drawn only when no commutator segment is ever under two brushes, that is $C/P \ge m + \tfrac12$. A lap winding also needs $C$ to be a multiple of $mP$. The lab draws diagrams up to $C = 48$. If you type a value that cannot be drawn, the centre says why:

![A message in place of the diagram: a lap winding needs C to be a multiple of mP, with a button to go to the nearest drawable value.](arm-notdrawn)

1. The reason.
2. **[ui:Go to nearest drawable (C = 16)]** moves to the nearest value that can be drawn.

### The dead zone, Problem 7-2

Choose **[ui:Problem 7-2 (dead zone)]**. The pole faces cover only part of the rotor; between them is the dead zone.

![The pole-arc controls: the beta field and slider, the Ignore dead zone button, and the pole-arc and dead-zone angles.](arm-beta)

1. $\beta$, the pole arc divided by the pole pitch. $\beta = 1$ means no dead zone.
2. **[ui:Ignore dead zone]** sets $\beta = 1$, as the book's examples do.
3. The angles of the pole arc and of the dead zone, mechanical and electrical.

![The Voltage and current results for Problem 7-2: E_A with the dead zone ignored, E_A,dz under the pole faces, the coil-level average, R_A and I_A.](arm-dz-results)

1. $E_A = K\phi\omega$ = {{arm.p72.EA: 45.24}} V, with the dead zone ignored (Eq. 7-38).
2. $E_{A,dz} = \beta K\phi\omega$ = {{arm.p72.EAdz: 33.93}} V, from the conductors under the pole faces.
3. $I_A$ is computed from $E_{A,dz}$, as in the solutions manual for this problem.

### A large winding, Example 7-3

Choose **[ui:Example 7-3 (duplex lap, 6 poles, 72 coils)]**. This winding has more coils than the lab draws, so the centre says so and offers **[ui:Show a small drawable version (C = 48)]**. The numbers are still exact.

![The Winding results for Example 7-3: Z, a, y_c, the brushes and the coils and conductors per path.](arm-ex73)

1. $Z = 2CN_C$, the number of conductors.
2. $a$, the number of parallel paths: $mP$ for a duplex lap winding.

![The Voltage and current results for Example 7-3, with E_A at the top.](arm-ex73-ea)

1. $E_A$ = {{arm.ex73.EA: 224.6}} V.

**Show the work** gives the steps in the order $Z$, $a$, $y_c$, $K$, $\omega$, $E_A$, then $R_A$, $I_A$, $V_T$ and $\tau$.

### Exam mode: identify the winding

![Exam mode after Check: a winding diagram without labels, the answer fields, and a list that marks each answer right or wrong with a reason.](arm-exam)

1. **[ui:New winding]** draws a new random winding.
2. The diagram, without the type of winding. Read it as in the exam.
3. Choose the type, the plex and the direction.
4. Type the numbers of coils, conductors, segments and parallel paths, and the commutator pitch $y_c$.
5. **[ui:Check]** grades every answer.
6. Each line says right or wrong, gives the correct value and the reason.

## Things to try

- **[ui:Count the paths]**
- **[ui:Simplex → duplex]**
- **[ui:Lap → wave, same coils and flux]**
- **[ui:Progressive → retrogressive]**
- **[ui:Can this wave winding be built?]**
- **[ui:The dead zone]**
- **[ui:Pole arc and brush voltage]**

## Limits

- Two-layer windings only, with as many slots as coils. The brushes stay on the neutral plane.
- Frog-leg windings are computed but never drawn.
- Diagrams are drawn up to $C = 48$; windings in which a segment would be under two brushes are not drawn.
- The field is uniform under a pole face and zero in the dead zone: no fringing at the pole tips.
- Not in the lab: armature reaction, $L\,di/dt$ voltages, interpoles and compensating windings (§ 7.4), equalizers, losses and the power-flow diagram (§ 7.7).
- Multiplex wave windings are beyond the course. The lab draws them and marks their pitch formula "beyond the textbook"; the exam mode does not use them.
