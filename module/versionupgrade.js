

/**
 * Split the version number of the system into its component parts and put them into an array
 * @param {string} version System version number as a string
 * @returns {number[]} Array containing the component numbers of the version number
 */
export function getVersionNumbers(version) {
    if (typeof (version) !== "string") {
        console.error("System version spliter given something that was not a string: " + version);
        return null;
    }

    let versionarray = [];
    let versiontest = new RegExp("(\\d+)\\.(\\d+)\\.(\\d+)?"); // Regex to match and split the version number

    if (versiontest.test(version)) {
        const result = version.match(versiontest);
        for (let i = 1; i < result.length; ++i) {
            versionarray.push(result[i]); // Push each separate number in the version to a separate index in the array
        }
    } else {
        console.error("System version splitter given something which could not be split: " + version);
        return null;
    }

    return versionarray;
}

/**
 * Check if the testing version number is newer than the base version number
 * @param {string} testing The version number to test
 * @param {string} baseversion The version number to test against
 * @returns {boolean} If true, the tested version is newer than the base version
 */
export function checkIfNewerVersion(testing, baseversion) {
    const oldver = getVersionNumbers(baseversion);
    const newver = getVersionNumbers(testing);

    for (let i = 0; i < newver.length; ++i) {
        if (newver[i] != oldver[i])
            return newver[i] > oldver[i];
    }

    return false;
}

/**
 * Check what data modifications upgrading from last version needs
 * @param {string} lastversion
 */
export async function upgradeVersion(lastversion) {
    if (getVersionNumbers(lastVersion)[0] < 4) {
        ui.notifications.info(game.i18n.localize("System update to 0.4 requires data migration, please wait..."), { permanent: true });
    }
}