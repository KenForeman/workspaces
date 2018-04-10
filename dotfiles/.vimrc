set t_Co=256
set background=dark
colorscheme molokai
syntax on
set paste
set ruler
set expandtab
set tabstop=4
set shiftwidth=4
map <F2> :retab
set laststatus=2
set number
filetype indent on
set wildmenu
map <silent> <A-Left> :tabprevious<CR>
map <silent> <A-Right> :tabnext<CR>
set listchars=tab:>-,trail:~,extends:>,precedes:<
set list
filetype plugin on
