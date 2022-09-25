module.exports = msToDaysAndHours();

function msToDaysAndHours(ms) {
    const msInDay = 86400000
    const msInHour = 3600000

    const days = Math.floor(ms / msInDay)
    const hours = Math.round((ms - (days * msInDay)) / msInHour * 100) / 100

    let pluralDays = `s`
    if (days === 1) {
        pluralDays = ``
    }
    let pluralHours = `s`
    if (hours === 1) {
        pluralHours = ``
    }

    return `${days} day${pluralDays} and ${hours} hour${pluralHours}`
}