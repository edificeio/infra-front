
# [3.5.0](https://github.com/opendigitaleducation/infra-front/compare/3.4.3...3.5.0) (2019-04-29)


### Bug Fixes

* Directory:
    * fix performance issue when retrieving filtered classes
* Workspace:
    * enable downloading trashed documents


### Features

* enable forcing a user to revalidate terms and conditions


## [3.4.3](https://github.com/opendigitaleducation/infra-front/compare/3.4.2...3.4.3) (2019-04-16)


### Bug Fixes

* Smart banner:
    * enable i18n for smart banner and overrides per theme. Also adds profile exclusion per theme.


## [3.4.2](https://github.com/opendigitaleducation/infra-front/compare/3.4.1...3.4.2) (2019-04-09)


### Bug Fixes

* Editor:
    * fix a bug with a plain text pasting. Now it converts the text to editor model.
* Miscellaneous:
    * chrome 73+ handles differently click target when selecting, fix the target detection on checkTool


## [3.4.1](https://github.com/opendigitaleducation/infra-front/compare/3.4.0...3.4.1) (2019-03-25)


### Features

* Calendar:
    * hide week switcher on month display


# [3.4.0](https://github.com/opendigitaleducation/infra-front/compare/3.3.6...3.4.0) (2019-03-04)


### Bug Fixes

* Behaviours:
    * fix workflow and behaviours for unavailable applications
* Editor:
    * fix the bug where the inline editor was moving on resize
    * avoid clipping image when changing size to small or medium
    * add upload visibility on base 64 import
* Image editor:
    * add a spinner when saving image
    * display settings according to rights
* Share panel:
    * Display the 'show more' button on inherited shares
* Workspace:
    * Avoid undefined shared array in folders
* Miscellaneous:
    * remove the style 'user-select: none' when touching a resizable element


### Features

* Workspace:
    * pre-3.4 Revisions of document compatible with the restoration mechanism
* CI:
    * use `Jenkinsfile` to build infra-front



## [3.3.6](https://github.com/opendigitaleducation/infra-front/compare/3.3.5...3.3.6) (2019-02-18)


### Bug Fixes


* Workspace:
    * fix cycle in the document hierarchy (document should not be able to move (or copy) into self or descendant)


## [3.3.5](https://github.com/opendigitaleducation/infra-front/compare/3.3.4...3.3.5) (2019-02-12)


### Bug Fixes

* Smart banner:
    * remove the store name



## [3.3.4](https://github.com/opendigitaleducation/infra-front/compare/3.3.2...3.3.4) (2019-01-22)


### Bug Fixes

* Editor:
    * fix pasted font-size (use the correct scaling)
    * use "font[size]" attribute to style font-size on copy/paste



## [3.3.2](https://github.com/opendigitaleducation/infra-front/compare/3.3.1...3.3.2) (2019-01-10)


### Bug Fixes

* Share panel:
    * renamed button class


## [3.3.1](https://github.com/opendigitaleducation/infra-front/compare/3.3.0...3.3.1) (2019-01-07)


### Bug Fixes

* Miscellaneous:
    * include hash's theme when building ts


# [3.3.0](https://github.com/opendigitaleducation/infra-front/compare/2.3.3...3.3.0) (2018-12-26)


### Bug Fixes

* Editor:
    * delete zws char at the beginning of the line when press delete
    * fix editor when pressing enter in a text which contains a <br>
    * fix line deletion
    * fix pressing enter at the start of a line
    * fix span merging, respect order while merging
    * fix the siblings tree position after pressing enter
    * rewrite css applying functionalities
    * catch and clean the clipboard
    * fix new line when in styled list
    * create a new line with zero-width space after list
    * selection fixes on delete and empty editor
    * detect CMD key on mac os x
    * apply selected color and selected background to multicolor lines
    * fix apply style to a block node
    * fix IE compatibility issue
    * fix selection issue with safari
    * whitelist possible tags for new line
    * let browser handle the paste event when non-html content
    * fix some style issue when pasting image from editor
    * let ie11 handles the pasting event
    * remove editor content when pressing enter while selecting the editor
    * removes condition when applying colors
    * fix workspace path
* Workspace:
    * updated class for spinner
    * changed spinner class when copying
    * issues with searching when copying or moving
    * adding tooltip for ellipsis
    * add feedback on 403 error
    * fix javascript exception when notifying contrib
    * prefetch loading screen to avoid locked screen
* Share panel:
    * wait users filtering before displaying 'No results'
* Media library:
    * fix wrong feedback color for dictaphone
    
    
### Features


* Workspace:
    * issues with searching when copying or moving
    * adding tooltip for ellipsis
* Media library:
    * multiple URL patterns for embed videos
    * adding image class to make icons in media lib uniform
    * documents ordered by created date in media library
* Share panel:
    *  Hide input placeholder if no results
* Smart banner:
    * adds smart banner
* Miscellaneous:
    * adding auto-size class on lightboxes h2