# OmniPascal 0.14.0 - Mac and Linux support

OmniPascal has finally arrived on Mac and Linux! All the features you know from the Windows version are now available also on Unix like operating systems. These are:

- Code completion
- Go to declaration
- Outlining
- Automatically implement methods and interfaces
- Add units to uses without scrolling
- Load search path from project files
- Auto generate build and run scripts from Lazarus and Delphi* projects for compiler integration into VSCode

Please keep in mind that the built in Pascal parser has support for Delphi syntax only. So you won't see great support for ObjectPascal source files using a different dialect. That may change in the future.

**Build scripts for Delphi projects work on Windows only*

## How to install
 - Install and open [Visual Studio Code](https://code.visualstudio.com/)
 - Click on the extensions icon in the left menu bar
 - Search for `omnipascal` and press install

Please ensure your system allows execution of software from any location!
If you have any problems getting started then please create a [bug report](https://bitbucket.org/Wosi/omnipascalissues/issues?status=new&status=open), ask on [StackOverflow](https://stackoverflow.com/tags/omnipascal) or create a comment under this blog post. 
Since this is the first release of OmniPascal for Mac and Linux it'd be a surprise if everything was working right from start.

## Release notes 

- First release of OmniPascal for Mac and Linux (64 bit)
- Change: Generated build and test tasks now run in VSCode's new terminal runner. That fixes the bug of infinite test runs when the application is waiting for user input via Read/ReadLn.
- Enhancement: The project file picker now also lists `.dproj` and `.lpi` files
- Bug fix: The project file picker was incomplete when opened right after starting the editor
- Enhancement: Improved recognition of file encoding when no BOM is present
- Bug fix: sometimes OmniPascal forgot the where Delphi is installed
- Bug fix: Constructor calls to overloaded generic types didn't resolve properly
- Bug fix: Code completion now works in DUnitX tests
- Bug fix: Interface implementations via resolution clauses in generic types were not recognized 
- Bug fix: Occasionally wrong missing interface implementation warning for derived classes where the base type implements an interface in the private section in a different file
- Internal reliability improvements