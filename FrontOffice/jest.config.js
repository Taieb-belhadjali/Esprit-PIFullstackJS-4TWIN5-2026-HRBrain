export default {
    testEnvironment: 'jsdom',
    transform: {
        "^.+\\.(ts|tsx|js|jsx)$": "babel-jest"
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    transformIgnorePatterns: [
        '/node_modules/(?!(lucide-react|clsx|class-variance-authority|tailwind-merge|@radix-ui|react-hook-form|cmdk|embla-carousel-react|date-fns|next-themes|react-day-picker|react-resizable-panels|input-otp|vaul|sonner|tw-animate-css)/)',
    ],
}