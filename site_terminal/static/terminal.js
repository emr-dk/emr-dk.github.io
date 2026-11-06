/* Connects the shell to the page: rendering, keyboard input and the opening sequence. */

(function () {
  const screen = document.getElementById('screen');
  const output = document.getElementById('output');
  const promptRow = document.getElementById('prompt-row');
  const promptLabel = document.getElementById('prompt');
  const input = document.getElementById('input');
  const titleText = document.getElementById('title-text');
  const hints = document.getElementById('hints');

  const MAX_LINES = 1500;
  const LINK = /(https?:\/\/[^\s"',]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  function measureCols() {
    const probe = document.createElement('span');
    probe.textContent = '0'.repeat(50);
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    output.append(probe);
    const charWidth = probe.getBoundingClientRect().width / 50;
    probe.remove();
    return Math.floor(output.clientWidth / charWidth) || 80;
  }

  const shell = createShell({ penguins, cols: measureCols });

  /* ---- rendering ---- */

  function scrollToEnd() {
    screen.scrollTop = screen.scrollHeight;
  }

  function appendText(parent, text, className) {
    let last = 0;
    for (const match of text.matchAll(LINK)) {
      if (match.index > last) parent.append(textSpan(text.slice(last, match.index), className));
      const href = match[0].includes('://') ? match[0] : `mailto:${match[0]}`;
      parent.append(link(match[0], href, className));
      last = match.index + match[0].length;
    }
    if (last < text.length) parent.append(textSpan(text.slice(last), className));
  }

  function textSpan(text, className) {
    const element = document.createElement('span');
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function link(text, href, className) {
    const element = document.createElement('a');
    element.textContent = text;
    element.href = href;
    if (className) element.className = className;
    return element;
  }

  function renderLine(line) {
    const element = document.createElement('div');
    element.className = 'line';
    const parts = typeof line === 'string' ? [{ t: line }] : line;
    for (const part of parts) {
      if (part.href) element.append(link(part.t, part.href, part.c));
      else appendText(element, part.t, part.c);
    }
    if (parts.every((part) => part.t === '')) element.textContent = ' ';
    return element;
  }

  /* Neighbouring pre lines share a scroller, so a wide table moves as one block. */
  function print(line) {
    const element = renderLine(line);
    if (Array.isArray(line) && line.pre) {
      let block = output.lastElementChild;
      if (!block || !block.classList.contains('pre-block')) {
        block = document.createElement('div');
        block.className = 'pre-block';
        output.append(block);
      }
      block.append(element);
    } else {
      output.append(element);
    }
    while (output.childElementCount > MAX_LINES) output.firstElementChild.remove();
  }

  function printPromptLine(command) {
    print([...shell.prompt(), { t: command }]);
  }

  function refreshPrompt() {
    promptLabel.replaceChildren();
    for (const part of shell.prompt()) promptLabel.append(textSpan(part.t, part.c));
    titleText.textContent = `emr-dk@portfolio: ${shell.path()}`;

    hints.replaceChildren();
    for (const command of shell.suggestions()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hint';
      button.textContent = command;
      hints.append(button);
    }
  }

  function applyEffects(result) {
    if (result.clear) output.replaceChildren();
    if (result.navigate) {
      setTimeout(() => { window.location.href = result.navigate; }, reducedMotion ? 0 : 450);
    }
  }

  function execute(command) {
    printPromptLine(command);
    const result = shell.run(command);
    applyEffects(result);
    result.lines.forEach(print);
    refreshPrompt();
    scrollToEnd();
  }

  /* ---- keyboard ---- */

  let historyIndex = null;
  let draft = '';

  function setInput(value) {
    input.value = value;
    input.setSelectionRange(value.length, value.length);
  }

  function browseHistory(step) {
    const entries = shell.historyList();
    if (entries.length === 0) return;
    if (historyIndex === null) {
      if (step > 0) return;
      draft = input.value;
      historyIndex = entries.length;
    }
    historyIndex = Math.max(0, historyIndex + step);
    if (historyIndex >= entries.length) {
      historyIndex = null;
      setInput(draft);
    } else {
      setInput(entries[historyIndex]);
    }
  }

  function completeInput() {
    const { value, options } = shell.complete(input.value);
    if (options.length) {
      printPromptLine(input.value);
      print(options.join('  '));
      scrollToEnd();
    }
    setInput(value);
  }

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const command = input.value;
      setInput('');
      historyIndex = null;
      execute(command);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      browseHistory(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      browseHistory(1);
    } else if (event.key === 'Tab' && !event.shiftKey && input.value !== '') {
      /* An empty prompt lets Tab move on to the page links, so keyboards never get stuck. */
      event.preventDefault();
      completeInput();
    } else if (event.ctrlKey && event.key === 'l') {
      event.preventDefault();
      output.replaceChildren();
    } else if (event.ctrlKey && event.key === 'c' && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
      print([...shell.prompt(), { t: `${input.value}^C` }]);
      setInput('');
      historyIndex = null;
      scrollToEnd();
    }
  });

  hints.addEventListener('click', (event) => {
    const button = event.target.closest('.hint');
    if (!button || intro.running) return;
    execute(button.textContent);
    if (finePointer) input.focus();
  });

  document.getElementById('terminal').addEventListener('click', (event) => {
    if (intro.running) { intro.skip(); return; }
    const selectingText = String(window.getSelection()) !== '';
    if (!selectingText && !event.target.closest('a, button')) input.focus();
  });

  /* ---- opening sequence ---- */

  const intro = {
    running: false,
    skip() {},
  };

  function showPrompt() {
    promptRow.hidden = false;
    hints.hidden = false;
    refreshPrompt();
    if (finePointer) input.focus();
    scrollToEnd();
  }

  function printWelcome() {
    print('');
    print([{ t: 'Welcome. This is a real shell, so go ahead and type.', c: 'c-lime' }]);
    print([{ t: 'Start with help, or use the shortcuts below.', c: 'c-dim' }]);
  }

  function playInstantly(commands) {
    print('Starting terminal');
    for (const command of commands) execute(command);
    printWelcome();
    showPrompt();
  }

  function playAnimated(commands) {
    let skipped = false;
    let wake = () => {};
    const sleep = (ms) => new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      wake = () => { clearTimeout(timer); resolve(); };
    });

    intro.skip = () => {
      skipped = true;
      wake();
    };

    async function typeCommand(command) {
      const line = renderLine([...shell.prompt()]);
      const typed = textSpan('');
      const caret = textSpan('█', 'c-lime');
      line.append(typed, caret);
      output.append(line);
      await sleep(350);
      for (const character of command) {
        if (skipped) break;
        typed.textContent += character;
        scrollToEnd();
        await sleep(32);
      }
      await sleep(250);
      line.remove();
    }

    async function run() {
      intro.running = true;
      print('Starting terminal');
      await sleep(300);

      for (const [index, command] of commands.entries()) {
        if (skipped) { execute(command); continue; }
        await typeCommand(command);
        printPromptLine(command);
        const { lines } = shell.run(command);
        for (const line of lines) {
          print(line);
          scrollToEnd();
          if (!skipped) await sleep(index === 0 ? 260 : 45);
        }
        refreshPrompt();
      }

      intro.running = false;
      printWelcome();
      showPrompt();
    }

    run();
  }

  document.addEventListener('keydown', (event) => {
    if (intro.running) {
      if (event.key.length === 1 || event.key === 'Enter' || event.key === 'Escape') intro.skip();
      return;
    }
    /* Typing anywhere on the page goes to the prompt. */
    const printable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (printable && document.activeElement === document.body) input.focus();
  });

  const openingCommands = [
    'curl penguinmonitor.aq/pengdata.json -o penguins.json',
    'python3 do_analysis.py',
  ];

  refreshPrompt();
  if (reducedMotion) playInstantly(openingCommands);
  else playAnimated(openingCommands);
}());
