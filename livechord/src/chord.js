// chords.js
// Represents a chord

export class Chord {
    constructor(raw) {
      // Remove possible overtones & sort
      this.raw = filterOvertones(raw);
      this.raw.sort((a, b) => a - b);
  
      // Parse chord data
      const { key, names, modifiers, octaves } = processRaw(this.raw);
      this.key = key;
      this.names = names;
      this.modifiers = modifiers;
      this.octaves = octaves;
    }
  
    get length() {
      return this.raw.length;
    }
  
    // Return a human-readable name of the chord as HTML
    get name() {
      const letters = "CDEFGAB";
      const mods = [
        String.fromCharCode(9837), // flat (♭)
        "",                        // natural
        String.fromCharCode(9839)  // sharp (♯)
      ];
  
      // If recognized as major/minor chord
      if (this.key) {
        let name = `${letters[this.key.base.name]}${mods[1 + this.key.base.modifier]}<sub>${this.key.base.octave}</sub> ${this.key.type}`;
        if (this.key.inversion > 0) {
          name += this.key.inversion === 1 ? " (1<sup>st</sup>" : " (2<sup>nd</sup>";
          name += " inversion)";
        }
        return name;
      }
  
      // Otherwise, just list the individual notes
      const out = [];
      for (let i = 0; i < this.names.length; i++) {
        out.push(
          `${letters[this.names[i]]}${mods[1 + this.modifiers[i]]}<sub>${this.octaves[i]}</sub>`
        );
      }
      return out.join(", ");
    }
  
    // Render an SVG of the chord
    svg() {
      // Force chord color to pure white
      const noteColor = "#ffffff";
      const staffColor = "#ffffff"; // staff lines also white
  
      const { names, modifiers, octaves } = this;
  
      const fragments = [];
      let minY = Infinity;
      let maxY = -Infinity;
      let flipCount = 1;
  
      function needsFlip(i) {
        return (
          (octaves[i] * 7 +
            names[i] -
            octaves[i - 1] * 7 -
            names[i - 1] ===
            1) ||
          (-octaves[i] * 7 -
            names[i] +
            octaves[i + 1] * 7 +
            names[i + 1] ===
            1)
        );
      }
  
      let modCount = 0;
  
      // Render note heads & accidentals
      for (let i = names.length - 1; i >= 0; i--) {
        const y = -(15 * names[i] + 7 * 15 * (octaves[i] - 4) - 5 * 15);
        const flip = i > 0 ? needsFlip(i) : false;
  
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
  
        // Note head
        fragments.push(`
          <use
            y="${y}"
            x="${flip ? (flipCount % 2) * 38 : 0}"
            fill="${noteColor}"
            fill-rule="evenodd"
            xlink:href="#note"
          ></use>
        `);
  
        if (flip) {
          flipCount++;
        } else {
          flipCount = 1;
        }
  
        // Accidentals (sharps/flats)
        const modOff = modCount * -22;
        if (modifiers[i] === +1) {
          fragments.push(`
            <use
              y="${y}"
              x="${modOff}"
              fill="${noteColor}"
              fill-rule="evenodd"
              xlink:href="#sharp"
            ></use>
          `);
        }
        if (modifiers[i] === -1) {
          fragments.push(`
            <use
              y="${y}"
              x="${modOff}"
              fill="${noteColor}"
              fill-rule="evenodd"
              xlink:href="#flat"
            ></use>
          `);
        }
  
        if (modifiers[i] !== 0 && modCount < 2) {
          modCount++;
        } else {
          modCount = 0;
        }
      }
  
      // Staff line logic
      let staffLen = 100;
      if (maxY - minY > 20) staffLen = maxY - minY + 80;
      let staffBot = 193;
      let staffTop = 193;
  
      if (193 + maxY < staffLen) {
        // Staff goes downward
        staffBot += minY + staffLen;
        staffTop += minY;
      } else {
        // Staff goes upward
        staffBot += maxY;
        staffTop += maxY - staffLen;
      }
  
      // Vertical staff line
      fragments.push(`
        <path
          d="M169,${staffBot} L169,${staffTop}"
          id="staff"
          stroke="${staffColor}"
          stroke-width="2"
        ></path>
      `);
  
      // Extra ledger lines for high notes
      if (maxY > 60) {
        const n = Math.ceil((maxY - 60) / 30);
        for (let i = 0; i < n; i++) {
          const y = 270 + i * 30;
          fragments.push(`
            <path
              d="M120,${y} L180,${y}"
              stroke="${staffColor}"
              stroke-width="2"
              stroke-linecap="square"
            ></path>
          `);
        }
      }
  
      // Extra ledger lines for low notes
      if (minY < -90) {
        const n = Math.floor((-60 - minY) / 30);
        for (let i = 0; i < n; i++) {
          const y = 90 - i * 30;
          fragments.push(`
            <path
              d="M120,${y} L180,${y}"
              stroke="${staffColor}"
              stroke-width="2"
              stroke-linecap="square"
            ></path>
          `);
        }
      }
  
      // Combine everything into an SVG (all colors are white):
      return `
  <?xml version="1.0" encoding="UTF-8"?>
  <svg
    width="230px"
    height="360px"
    viewBox="0 0 200 360"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
  >
    <!-- Generator: chords -->
    <defs>
      <path
        id="note"
        fill="${noteColor}"
        d="M153.939693,209.121732 C164.766782,206.33534 171.780011,197.754008 169.604178,189.954791 C167.428346,182.155574 156.887396,178.091876 146.060307,180.878268 C135.233218,183.66466 128.219989,192.245992 130.395822,200.045209 C132.571654,207.844426 143.112604,211.908124 153.939693,209.121732 Z"
      ></path>
      <path
        id="flat"
        fill="${noteColor}"
        d="M112.4986,196.73535 C109.25184,200.501149 106.518756,202.656532 102.917376,205.190918 L102.917376,192.713611 C103.736107,190.794787 104.943476,189.241454 106.544665,188.048801 C108.140672,186.860958 109.757406,186.264632 111.394868,186.264632 C119.042524,187.294497 116.364248,193.327346 112.4986,196.73535 Z M102.917376,186.562795 C102.917376,186.562795 102.917376,166.867315 102.917376,151.592738 C102.917376,149.410449 100,149.528546 100,151.592738 L100,207.460805 C100,209.153602 100.497457,210 101.49237,210 C102.067554,210 102.782198,209.552755 103.850108,208.961238 C111.114572,204.809125 115.781265,201.447865 120.441481,195.517209 C121.882188,193.683747 122.900943,189.525767 120.815299,186.621947 C119.514657,184.811039 117.036136,182.908951 113.859564,182.346673 C109.747519,181.618818 106.20142,183.518887 102.917376,186.562795 Z"
      ></path>
      <path
        id="sharp"
        fill="${noteColor}"
        d="M115.163856,165.147671 C114.787851,165.336296 114.538012,165.585581 114.350424,165.962 C114.22426,166.213777 114.22426,167.091258 114.22426,172.612905 L114.22426,178.824239 L111.030296,180.266764 L107.833013,181.647799 L107.77159,175.62509 C107.77159,170.228916 107.645425,169.60072 107.583173,169.350604 C106.954009,168.221346 105.261573,168.284499 104.762724,169.475247 C104.636559,169.727024 104.636559,170.604504 104.636559,176.377929 L104.636559,183.028834 L102.629542,183.843162 C101.377853,184.345055 100.564422,184.784626 100.502169,184.909268 C100,185.411161 100,185.474313 100,188.547988 C100,190.995129 100,191.308396 100.188417,191.623325 C100.376835,192.18837 101.067421,192.626279 101.689945,192.501637 C101.943105,192.501637 102.630372,192.18837 103.259536,191.999745 L104.575967,191.4347 C104.637389,191.4347 104.637389,194.195108 104.637389,197.709186 L104.637389,204.044331 L102.630372,204.85866 C101.378683,205.423704 100.565252,205.800123 100.502999,205.987918 C100.00083,206.429151 100.00083,206.552962 100.00083,209.565147 C100.00083,212.074609 100.00083,212.388707 100.189247,212.700313 C100.377665,213.265357 101.068251,213.641776 101.690775,213.580286 C101.943935,213.580286 102.631202,213.265357 103.260366,213.015242 L104.576797,212.450198 C104.638219,212.450198 104.638219,215.024473 104.638219,218.098149 C104.638219,222.989938 104.638219,223.80759 104.764384,224.057705 C105.264063,225.314098 107.082664,225.314098 107.584833,224.057705 C107.77325,223.80759 107.77325,222.928447 107.77325,217.4068 L107.77325,211.00601 L110.970534,209.629961 L114.22592,208.312078 L114.22592,214.394615 C114.22592,219.792451 114.290662,220.418986 114.352085,220.607611 C115.042671,221.79919 116.608942,221.736869 117.172533,220.542797 C117.360951,220.296005 117.360951,219.919586 117.360951,213.580286 L117.360951,206.929381 L119.367968,206.115053 C120.619657,205.550008 121.436408,205.173589 121.497831,204.985795 C122,204.547885 122,204.42075 122,201.409396 C122,198.899934 122,198.587498 121.811583,198.27423 C121.558423,197.709186 120.932579,197.332767 120.306735,197.394257 C120.053575,197.394257 119.366308,197.709186 118.675722,197.959301 L117.420713,198.524346 C117.359291,198.524346 117.359291,195.700786 117.359291,192.18837 L117.359291,185.913884 L119.366308,185.097893 C120.617997,184.532849 121.434748,184.15643 121.496171,183.968636 C121.99834,183.466743 121.99834,183.403591 121.99834,180.393068 C121.99834,177.883606 121.99834,177.569508 121.809923,177.25624 C121.556763,176.691196 120.930919,176.314777 120.305075,176.377929 C120.051915,176.377929 119.364648,176.691196 118.674061,176.942973 L117.419053,177.508018 C117.357631,177.508018 117.357631,174.933742 117.357631,171.923218 C117.357631,166.590196 117.357631,166.213777 117.169213,165.90051 C116.856291,165.147671 115.915865,164.771252 115.163856,165.147671 Z"
      ></path>
    </defs>
  
    <!-- 5 main staff lines (also white) -->
    <path d="M0,240 L230,240" stroke="${staffColor}" stroke-width="2" stroke-linecap="square"></path>
    <path d="M0,210 L230,210" stroke="${staffColor}" stroke-width="2" stroke-linecap="square"></path>
    <path d="M0,180 L230,180" stroke="${staffColor}" stroke-width="2" stroke-linecap="square"></path>
    <path d="M0,150 L230,150" stroke="${staffColor}" stroke-width="2" stroke-linecap="square"></path>
    <path d="M0,120 L230,120" stroke="${staffColor}" stroke-width="2" stroke-linecap="square"></path>
  
    ${fragments.join("")}
  </svg>
  `;
    }
  }
  
  /* -----------------------------------------------------
     Helper functions
     ----------------------------------------------------- */
  
  // Filter out overtones (duplicate semitones)
  function filterOvertones(raw) {
    if (raw.length <= 3) return raw;
    const seen = new Array(12).fill(false);
    const res = [];
    for (let i = 0; i < raw.length; i++) {
      const n = (120 + raw[i]) % 12;
      if (!seen[n]) {
        res.push(raw[i]);
        seen[n] = true;
      }
    }
    return res;
  }
  
  // Mapping from semitones to note letters: 0->C, 1->D, 2->E, 3->F, 4->G, 5->A, 6->B
  const nameMap = [
    [0],     // C
    [0, 1],  // C#/Db
    [1],     // D
    [1, 2],  // D#/Eb
    [2],     // E
    [3],     // F
    [3, 4],  // F#/Gb
    [4],     // G
    [4, 5],  // G#/Ab
    [5],     // A
    [5, 6],  // A#/Bb
    [6]      // B
  ];
  
  // Process raw chord data
  function processRaw(raw) {
    const offset = -9; // offset so that C4 => zero in our logic
    const names = new Array(raw.length);
    const modifiers = new Array(raw.length);
    const octaves = new Array(raw.length);
    let key = null;
  
    function getOct(n) {
      const m = n - offset;
      return (m >= 0 ? Math.floor(m / 12) : -Math.ceil(-m / 12)) + 4;
    }
    function getTone(n) {
      const m = n - offset;
      return (120 + m) % 12;
    }
  
    // Determine names + modifiers
    for (let i = 0; i < raw.length; i++) {
      const tone = getTone(raw[i]);
      if (nameMap[tone].length === 1) {
        names[i] = nameMap[tone][0];
        modifiers[i] = 0; // natural
      } else {
        const [sharp, flat] = nameMap[tone];
        // Heuristic for deciding between sharp or flat
        if (i === 0 || raw[i] - raw[i - 1] >= 4) {
          names[i] = sharp;
          modifiers[i] = +1; // sharp
        } else {
          names[i] = flat;
          modifiers[i] = -1; // flat
        }
      }
      octaves[i] = getOct(raw[i]);
    }
  
    // If exactly 3 notes, attempt chord detection
    if (raw.length === 3) {
      for (let inversion = 0; inversion < 3; inversion++) {
        // Adjust note positions for inversion
        const first = raw[(3 - inversion + 0) % 3] + (inversion > 0 ? -12 : 0);
        const second = raw[(3 - inversion + 1) % 3] + (inversion > 1 ? -12 : 0);
        const third = raw[(3 - inversion + 2) % 3];
  
        let type = null;
        // major triad => 4 semitones + 3 semitones
        if (second - first === 4 && third - second === 3) {
          type = "major";
        }
        // minor triad => 3 semitones + 4 semitones
        if (second - first === 3 && third - second === 4) {
          type = "minor";
        }
        if (type !== null) {
          const baseIdx = (3 - inversion + 0) % 3;
          key = {
            type,
            inversion,
            base: {
              name: names[baseIdx],
              modifier: modifiers[baseIdx],
              octave: octaves[baseIdx] - (inversion > 0 ? 1 : 0)
            }
          };
          break;
        }
      }
    }
  
    return { key, names, modifiers, octaves };
  }
  