# Bridging the 8-Bit Gap: Developing for the TRS-80 with Modern Tools

Hey there, fellow retrocomputing enthusiasts! Today I'm super excited to share a little project I've been tinkering with that brings together the charm of yesterday's computing with the conveniences of today's development environment. Let's dive right in!

## The Mighty TRS-80: A Quick Trip Down Memory Lane

For those who might have missed this gem of computing history, the TRS-80 (affectionately known as the "Trash-80" by some) was one of the pioneering personal computers released by Tandy Corporation through their Radio Shack stores back in 1977. This little beauty sported a Z-80 processor chugging along at a blazing 1.77 MHz, with a whopping 4KB to 48KB of RAM depending on the model and configuration.

The original Model I featured a monochrome display capable of 64×16 text characters, later models improved on this with higher resolution and even (gasp!) lowercase letters! The computer stored programs on cassette tapes initially, though disk drives became available later. All this computing power was wrapped in a distinctive beige/silver case that screamed "THE FUTURE IS HERE!"

## Why Retro-Computing Still Matters

So why are folks like us still fiddling with these ancient machines? Well, there's something magical about the constraints of these systems. When every byte counts and processor cycles are precious, coding becomes a beautiful puzzle that rewards cleverness and efficiency.

If you're diving into this world, definitely check out [Ira Goldklang's TRS-80 Revived Site](https://www.trs-80.com/) for an amazing archive of information. The [Tandy Assembly](https://tandyassembly.com/) folks also do incredible work keeping the community vibrant, with fantastic content on their [YouTube channel](https://www.youtube.com/c/TandyAssembly).

## The TRS-80 Ecosystem: More Than Just BASIC

People often don't realize just how capable these machines were! The TRS-80 wasn't just for playing Hunt the Wumpus or Star Trek. These machines ran serious business software like VisiCalc (the grandfather of Excel), general ledgers, and database systems like Radio Shack's PROFILE (which my dad used religiously for his business, complete with mail merges and label printing).

And of course, there were the games! Despite limited graphics, developers squeezed out impressive arcade-style games with wild sound effects and even multi-voice music. Let's not forget BBSes (Bulletin Board Systems) - the primitive social networks before the internet went mainstream!

## Enter trs80gp: The Emulator That Changed Everything

Fast-forward to today, and we're blessed with some fantastic emulators. My personal favorite is [trs80gp](http://48k.ca/trs80gp.html), which is absolutely brilliant. This emulator supports all TRS-80 models, runs on multiple platforms, and includes a full-featured debugger that would make any developer drool. Oh, and it's free!

What makes trs80gp stand out is its combination of accuracy and developer-friendly features. It's like having a TRS-80 with superpowers and x-ray vision!

## The Old Ways of TRS-80 Development

Back in the day, if you wanted to code in assembly language on the TRS-80, you were probably using EDTASM (Editor/Assembler) or maybe TBUG for debugging. While revolutionary for their time, these tools were... let's just say "challenging" by today's standards.

Imagine writing code with limited line editing capabilities, no search-and-replace, no syntax highlighting, and debugging by manually tracking register values and memory contents! It was like trying to build a ship in a bottle while wearing oven mitts. Respect to those pioneers who created amazing software under these conditions!

## The Bridge: VS Code + trs80gp Extension

So here's where my little project comes in - I wanted the joy of TRS-80 development WITHOUT the pain of 1970s tooling. What if we could use a modern IDE like Visual Studio Code but target our beloved Z-80?

**TA-DA!** 🎉 Introducing my VS Code extension that creates a seamless bridge between the modern development environment you love and the retro machine you adore!

This extension integrates VS Code with trs80gp to give you a smooth, modern development experience. Here's what it brings to the table:

- Full integration with [zmac](http://48k.ca/zmac.html), a powerful Z-80 cross-assembler
- One-click commands to assemble and run your code in the emulator
- Debug mode that passes breakpoints (up to 4 currently) directly to the emulator
- Symbol file integration for meaningful debugging
- Error navigation - click on errors to jump directly to the problematic line

The workflow is beautifully simple:
1. Write your Z-80 assembly in VS Code with all the modern conveniences
2. Hit a key to assemble and run in the emulator
3. Debug with breakpoints that sync between VS Code and trs80gp
4. Fix issues and repeat!

No more edit-quit-assemble-load-run cycles that waste precious minutes of your life. Just write code, hit a key, and watch your creation spring to life on your virtual TRS-80!

Setting it up is straightforward too - just point the extension to your trs80gp installation, configure a few preferences like your target TRS-80 model, and you're ready to roll.

## What's Next? Full VS Code Debugging!

This is just the beginning! I'm currently working on integrating with [DeZog](https://github.com/maziac/DeZog) to provide a full Visual Studio Code debugging experience for the TRS-80. Imagine stepping through Z-80 code line by line, watching variables, inspecting memory - all within VS Code's familiar debugging interface. That's coming later this year, so stay tuned!

## Give It a Whirl!

If you're interested in TRS-80 development or just want to dabble in some nostalgic Z-80 assembly, check out the extension on [GitHub](https://github.com/your-username/trs80gp-vscode) and give it a spin! Binaries are available in the releases section.

This is an open-source labor of love, so contributions, bug reports, and feature requests are always welcome. Let's keep the TRS-80 spirit alive, just with slightly less eye strain and far fewer cassette loading errors!

Happy retro coding, everyone! 🖥️⚡



# Wait a minute... what is it about these VSIX files and why can't the extension be found on the marketplace?

Ok, let's talk about actually getting this extension onto your machine! Since this is a fresh-out-of-the-garage project, you won't find it on the official VS Code Extension Marketplace just yet. But don't let that spook you!

## Why Isn't It On The Marketplace?

Extensions not being on the official marketplace doesn't mean there's anything sketchy going on. There are plenty of legitimate reasons:

- Brand new projects still in early testing (like this one!)
- Extensions built for specific communities or niche use cases
- Projects that don't meet all the marketplace publishing requirements yet
- Personal or organization-specific tools not intended for wide distribution

The VS Code marketplace is awesome, but it's not the only way to share extensions. In fact, Microsoft designed VS Code with a straightforward method to install extensions from VSIX files specifically for cases like this.

## Installing the VSIX Extension

There are two easy ways to get the extension installed:

### Method 1: Using the VS Code GUI

1. Download the `.vsix` file from the [GitHub releases page](https://github.com/your-username/trs80gp-vscode/releases)
2. Open VS Code
3. Click on the Extensions icon in the Activity Bar (or press `Ctrl+Shift+X`)
4. Click on the "..." menu (top-right of the Extensions view)
5. Select "Install from VSIX..."
6. Navigate to your downloaded `.vsix` file and select it
7. That's it! VS Code will install the extension and prompt you to reload

<<< I might add a screenshot here :-) >>>

### Method 2: Using the Command Line

If you prefer typing over clicking (as many retro computing fans do!), you can use the VS Code CLI:

```bash
code --install-extension path/to/trs80gp-extension.vsix
```

After installation, you might need to reload VS Code, and then you're all set! The extension will appear in your extensions list just like any marketplace extension, complete with all the configuration options and commands we've talked about.

Don't worry - VS Code maintains good isolation between extensions, so installing from a VSIX is just as safe as the marketplace when you trust the source. And since this is an open-source project with all code available on GitHub, you can even inspect exactly what you're installing if you're the curious type (and if you're into retro computing, you probably are!).

