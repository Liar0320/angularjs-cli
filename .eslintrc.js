module.exports  = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": false
    },
    "globals": {
        "angular":false,
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2015,
        "sourceType": "module"
    },
    "plugins": [
        'html',
    ],
    "rules": {
        'indent': [ 'error', 4 ],
        "linebreak-style": [
            0,
            "error",
            "windows"
        ],
        // "quotes": [
        //     "error",
        //     "signle"
        // ],
        "semi": [
            "error",
            "always"
        ]
    }
}

//https://www.jianshu.com/p/f2f06a0e154b
