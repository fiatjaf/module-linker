let
  pkgs = import <nixpkgs> {};
  # nanomsg-py = ...build expression for this python library...;
in pkgs.mkShell {
  buildInputs = with pkgs; [
    python3
    # python3.pkgs.requests
    fish
    pup
    jq
    curl
    # nanomsg-py
  ];
  shellHook = ''
    # Tells pip to put packages into $PIP_PREFIX instead of the usual locations.
    # See https://pip.pypa.io/en/stable/user_guide/#environment-variables.
    export PIP_PREFIX=$(pwd)/_build/pip_packages
    export PYTHONPATH="$PIP_PREFIX/${pkgs.python3.sitePackages}:$PYTHONPATH"
    export PATH="$PIP_PREFIX/bin:$PATH"
    unset SOURCE_DATE_EPOCH
  '';
}

# TO UPDATE
# cd ./data && fish ./hackage-update.fish && fish ./purescript-update.fish && fish ./elm-update.fish
