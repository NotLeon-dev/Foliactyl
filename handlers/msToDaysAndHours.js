export default function msToDaysAndHours(ms) {
    const msInDay = 86400000;
    const msInHour = 3600000;

    const days = Math.floor(ms / msInDay);
    const hours = Math.round((ms - (days * msInDay)) / msInHour * 100) / 100;

    const pluralDays = days === 1 ? '' : 's';
    const pluralHours = hours === 1 ? '' : 's';

    return `${days} day${pluralDays} and ${hours} hour${pluralHours}`;
}