---
id: eee321-three-phase-transformer
title: Three-phase transformer connections
states:
  - eee321-three-phase-transformer
  - eee321-three-phase-transformer?p=yd
  - eee321-three-phase-transformer?p=yd&by=unit
  - eee321-three-phase-transformer?p=r212
  - eee321-three-phase-transformer?p=r212&hero=circuit
---

## What this lab shows

A bank of three single-phase transformers, connected Y–Y, Y–Δ, Δ–Y or Δ–Δ. The ideal model shows the $\sqrt3$ factors and the phase shift between the primary and secondary line voltages. The real-bank model solves the end-of-chapter bank problems: tests, per-unit values, voltage regulation, losses and efficiency (Chapman § 2.5–2.7, 2.10).

## Quick start

1. Open the lab. It starts in **[ui:Ideal]** with **[ui:Example 2-9 ratings (Δ–Y 13.8 kV / 208 V, 50 kVA)]**.
2. Press play. Dots move along the wires with the current, back and forth as in an AC circuit.
3. Click **[ui:Y–Y]**, **[ui:Y–Δ]**, **[ui:Δ–Y]** and **[ui:Δ–Δ]** in turn. Watch the phasor diagrams and the ratio $V_{LL}/V_{ll}$ in the results.
4. Choose **[ui:Real bank]** to add the resistance, the leakage reactance and the excitation branch of each transformer.

## The screen

![The transformer lab on a computer: model, preset and connection choices on the left, the wiring of three transformers in the centre with the phasor diagrams below, and the results on the right.](lab-xf-desktop)

1. The model: **[ui:Ideal]** or **[ui:Real bank]**.
2. **[ui:Preset]**: textbook examples and problems. The list depends on the model.
3. The connection.
4. The wiring of the three transformers T1, T2 and T3, drawn from the connection. A dot on a coil marks its dotted end. Each coil shows its voltage phasor.
5. Playback. The readout $\omega t$ gives the instant that the dots, the phasors and the waveform show.
6. The results: the ratio, $a$ and the phase shift first, then the primary and secondary values, then the phasors.

Below the wiring you find **[ui:Phasor diagrams]**, **[ui:Line voltages against time]**, **What is happening** and **Show the work**. In the real bank there are also **[ui:Power flow (bank)]** and **[ui:Voltage regulation and efficiency against load]**.

![The transformer lab on a phone: a Wiring and Phasors choice with the playback buttons, the wiring drawing, and the tabs below.](lab-xf-phone)

## Enter a textbook problem: ideal bank

A typical problem: a Y–Δ bank steps down a line voltage; each transformer has a given turns ratio $a$. Find the secondary line voltage and the phase shift.

**Step 1.** Choose **[ui:Y–Δ step-down 13.8 kV, a = 10]** under **Preset**. For other data, choose the connection and type the values:

- **[ui:line voltage and a]**: the primary line voltage $V_{LL}$ and the turns ratio $a = N_P/N_S$ of one transformer;
- **[ui:unit rating]**: the winding voltages $V_{\phi P}$, $V_{\phi S}$ and the rating $S_\phi$ of one transformer. **[ui:Rated load]** then sets the load to the rating of the bank, $S = 3S_\phi$.

Set the load under **[ui:Balanced load]**: $S$, PF and **[ui:lagging]**, **[ui:unity]** or **[ui:leading]**.

**Step 2. Read the results.**

![The first block of results for the Y–Delta bank: the line-voltage ratio, the turns ratio and the phase shift.](xf-ideal-results)

1. $V_{LL}/V_{ll} = \sqrt3\,a$ = {{xf.yd.ratio: 17.32}}, with its equation number (2-89).
2. $a$ = {{xf.yd.a: 10.00}}, the turns ratio of one transformer, not of the line voltages.
3. $\angle V_{ab} - \angle V_{AB}$ = {{xf.yd.shift: −30.00}}°: the secondary lags.

**Step 3. See the shift.**

![The phasor diagrams: primary on the left and secondary on the right, with a dashed line and an arc showing the lag of V_ab behind V_AB.](xf-ideal-phasors)

1. Primary and secondary phasors on the same angle reference. On the secondary diagram, a dashed line shows the direction of $V_{AB}$ and an arc shows the shift.
2. **Rotate with** $\omega t$ turns the phasors with time, or freezes them at $t = 0$.
3. **[ui:Overlay secondary]** draws the secondary on the primary diagram, scaled.

**Step 4.** Open **Show the work**. It goes through the connection step by step and ends with the phase shift and its reason.

## Enter a textbook problem: real bank (Problem 2-12)

Problem 2-12 gives the rating of one transformer, an open-circuit test on the low-voltage side and a short-circuit test on the high-voltage side. It asks for the equivalent circuit, the voltage regulation and the efficiency.

**Step 1.** Choose **[ui:Real bank]**, then **[ui:Problem 2-12 (3 × 20 kVA, 24 000/277 V, Δ–Y, OC + SC tests)]**.

**Step 2. The rating.**

![The Rating section: the rating given for one transformer, with S_phi, V_phiP and V_phiS, and the bank values below.](xf-real-rating)

1. Given as **[ui:one transformer]**, because the problem rates each transformer. Choose **[ui:the bank]** when the problem gives the bank's $S$ and line voltages.
2. $S_\phi$, the rating of one transformer.
3. $V_{\phi P}$, the primary winding voltage.
4. $V_{\phi S}$, the secondary winding voltage. The line under the fields gives the bank's $S$, $V_{LL}$, $V_{ll}$ and $a$.

**Step 3. The tests.**

![The Equivalent circuit from section with test data selected: the open-circuit test box with its side, reading form and three meter readings, and the short-circuit test box below.](xf-real-tests)

1. **[ui:test data]**. If the problem gives the circuit instead, choose **[ui:per-unit]** or ohms on one side.
2. **[ui:Open-circuit test]**: on. Switched off, the shunt branch is neglected.
3. **[ui:Measured on]**: the side where the meters are. Here **[ui:secondary (LV)]**.
4. **[ui:Readings are]**: **[ui:bank line values]** when the meters read the lines of the bank, **[ui:one transformer]** when the problem gives one transformer's values.
5. The voltmeter, ammeter and wattmeter readings.
6. The same readings for one transformer. A wattmeter reading above $V \cdot I$ is refused with a red message.

The **[ui:Short-circuit test]** box below works the same way. In this problem it is on the **[ui:primary (HV)]** side.

**Step 4. The operating point.**

![The Operating point section: hold the secondary at rated voltage, load as S_load, the load slider with a Rated load button, and the power factor.](xf-real-operating)

1. **[ui:secondary at rated V]**: the usual exam case. The lab finds the primary voltage that is needed. **[ui:primary at rated V]** holds the primary instead.
2. The load as $S_{load}$ or as **[ui:% of rated]**.
3. $S_{load}$, the load of the bank.
4. **[ui:Rated load]** sets the load to the rating.
5. The power factor, with **[ui:lagging]**, **[ui:unity]** or **[ui:leading]** below it.

**Step 5. Read the answers.**

![The results Operating point and Power and efficiency: phasors of one transformer, VR, the load angle, then output power, copper loss, core loss, input power and efficiency.](xf-real-results)

1. VR = {{xf.r212.VR: 2.94}} %, from Eq. (2-62).
2. $P_{Cu}$, the copper loss of the bank.
3. $P_{core}$, the core loss of the bank.
4. $\eta$ = {{xf.r212.eta: 97.15}} %, from Eq. (2-67).

**Step 6. See the circuit.**

![The Equivalent circuit view: the per-phase circuit of one transformer with the values of every element, the voltages and the currents.](xf-real-circuit)

1. **[ui:Connections]** or **[ui:Equivalent circuit]**: what the centre shows.
2. The circuit of one transformer with its values. Neglected elements are faint and dashed. Below it are sketches of the two tests and the per-phase phasor diagram.

**[ui:Show circuit referred to]**, under **[ui:Display]**, refers the circuit to the HV side, the LV side or per-unit. It changes the display only. **Show the work** gives every step in exam order.

> The solutions manual has errors in Problems 2-10 to 2-13. For Problem 2-12, its VR and $\eta$ are wrong; the book's equations give the values above. The lab shows a note under **What is happening** for each of these presets. Follow the book's equations, not the manual.

## Things to try

In the ideal model:

- **[ui:The trap]**
- **[ui:The exam bank]**
- **[ui:Line or phase current?]**
- **[ui:Which way is the shift?]**
- **[ui:Y–Y versus Δ–Δ]**
- **[ui:Third harmonic]**

In the real bank:

- **[ui:The Δ trap]**
- **[ui:Leading load]**
- **[ui:Half the load]**
- **[ui:HV or LV?]**
- **[ui:Ohms or per-unit]**
- **[ui:No core data]**

## Limits

- The three transformers are identical, and the load is balanced.
- No current circulates in a delta. The third-harmonic view is an illustration: its amplitude $h$ is a display value, and the circulating current is described, not computed.
- The real bank uses the approximate equivalent circuit, not the exact one.
- Not in the lab: open-Δ and other two-transformer connections, autotransformers, unbalanced loads, derating, inrush current and all-day efficiency.
- For Δ–Y, the lab uses the wiring that gives the lag stated in Chapman's text and the course slides. The figure as printed gives a lead; a note in **Show the work** explains this.
