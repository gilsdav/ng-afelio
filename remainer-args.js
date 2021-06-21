function getAllArgs(command, includeHelp, includeOptions) {
    const remainArgs = command.args.filter(a => a.startsWith('-'));
    let options = [];
    if (includeOptions) {
        options = command.options.map(o => o.long);
    }
    if (includeHelp) {
        if (!options.includes('--help')) {
            options.push('--help')
        }
    }
    return [...remainArgs, ...options];
}

module.exports = {
    getAllArgs
};
