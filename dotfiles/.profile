export PS1="\[\033[38;5;1m\]$?\[\],\[\033[38;5;214m\]\t\[\],\[\033[38;5;34m\]\u@\H\[\]:\[\033[38;5;27m\]\w\[\]\[\033[38;5;15m\]$\[\] "
export HISTTIMEFORMAT="%m/%d/%y %T "
export EDITOR=/usr/bin/vim
export BLOCKSIZE=1k
export CLICOLOR=1
export LSCOLORS=ExFxBxDxCxegedabagacad

## PowerLine Shell (git) https://powerline.readthedocs.io/en/latest/installation.html
function _update_ps1() {
    PS1=$(powerline-shell $?)
}

if [[ $TERM != linux && ! $PROMPT_COMMAND =~ _update_ps1 ]]; then
    PROMPT_COMMAND="_update_ps1; $PROMPT_COMMAND"
fi

## fzf Ctrl-R history goodness
[ -f ~/.fzf.bash ] && source ~/.fzf.bash

## Visual Studio Code goodness: https://code.visualstudio.com/docs/setup/mac

alias egrep='egrep --color=auto'
alias fgrep='fgrep --color=auto'
alias rgrep='grep --color=auto -Iir $1'
alias grep='grep --color=auto'
alias grepno="grep --color=never -n -E '.*'"
alias ls='ls -G'

## docker goodness
alias dcbuild='docker-compose build'
alias dcdestroy='docker-compose stop && docker-compose rm -f'
alias dclogs='docker-compose logs -f'
alias dcps='docker-compose ps'
alias dcpull='docker-compose pull'
alias dcstop='docker-compose stop'
alias dcup='docker-compose up -d'
alias dcvi='vi docker-compose.yml'

alias qfind="find . -name "                         # qfind:    Quickly search for file
alias myip='curl ip.appspot.com'                    # myip:         Public facing IP Address
alias netCons='lsof -i'                             # netCons:      Show all open TCP/IP sockets
alias flushDNS='dscacheutil -flushcache'            # flushDNS:     Flush out the DNS Cache
alias lsock='sudo /usr/sbin/lsof -i -P'             # lsock:        Display open sockets
alias lsockU='sudo /usr/sbin/lsof -nP | grep UDP'   # lsockU:       Display only open UDP sockets
alias lsockT='sudo /usr/sbin/lsof -nP | grep TCP'   # lsockT:       Display only open TCP sockets
alias ipInfo0='ipconfig getpacket en0'              # ipInfo0:      Get info on connections for en0
alias ipInfo1='ipconfig getpacket en1'              # ipInfo1:      Get info on connections for en1
alias openPorts='sudo lsof -i | grep LISTEN'        # openPorts:    All listening connections
alias showBlocked='sudo ipfw list'                  # showBlocked:  All ipfw rules inc/ blocked IPsA

alias ll='ls -alF'
alias la='ls -hA'
alias l='ls -CF'
alias vi='vim'
alias subl='/Applications/Sublime\ Text.app/Contents/SharedSupport/bin/subl'
alias mvim='/Applications/mvim --remote-tab-silent'
alias nomore='find ./ -iname .DS_Store -delete'
ww () { /usr/bin/curl http://wttr.in/"$@" ; }
alias ytdl='youtube-dl -f bestaudio --extract-audio --audio-format mp3 -l'
