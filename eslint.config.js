import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
    js.configs.recommended,

    // jsx-a11y 접근성 린트 (warning 레벨로 도입)
    {
        ...jsxA11y.flatConfigs.recommended,
        files: ["src/**/*.{ts,tsx}"],
        rules: Object.fromEntries(
            Object.keys(jsxA11y.flatConfigs.recommended.rules)
                .filter((k) => k.startsWith("jsx-a11y/"))
                .map((k) => [k, "warn"]),
        ),
    },

    // React + TypeScript (src/ 디렉토리)
    {
        files: ["src/**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: { ...globals.browser },
            parser: tseslint.parser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
            "react-hooks": reactHooks,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            // react-hooks v7 신규 규칙: WS 컨텍스트의 useEffect 내 setState/ref 패턴은 의도적 사용
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/refs": "warn",
            "react-hooks/immutability": "warn",
            // TypeScript가 타입/전역 변수를 검사하므로 ESLint no-undef 비활성화
            // (React JSX Transform + DOM 타입: React, RequestInit 등)
            "no-undef": "off",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
            }],
            "no-console": "off",
            "eqeqeq": ["error", "always"],
            "no-var": "error",
            "prefer-const": "warn",
        },
    },

    // 무시 패턴
    {
        ignores: ["dist/", "node_modules/", ".worktrees/"],
    },
);
