export class TimeSpan {
    private totalMilliseconds: number;

    constructor(milliseconds: number = 0) {
        this.totalMilliseconds = milliseconds;
    }

    static fromWeeks(weeks: number): TimeSpan {
        return new TimeSpan(weeks * 7 * 24 * 60 * 60 * 1000);
    }

    static fromDays(days: number): TimeSpan {
        return new TimeSpan(days * 24 * 60 * 60 * 1000);
    }

    static fromHours(hours: number): TimeSpan {
        return new TimeSpan(hours * 60 * 60 * 1000);
    }

    static fromMinutes(minutes: number): TimeSpan {
        return new TimeSpan(minutes * 60 * 1000);
    }

    static fromSeconds(seconds: number): TimeSpan {
        return new TimeSpan(seconds * 1000);
    }

    static fromMilliseconds(milliseconds: number): TimeSpan {
        return new TimeSpan(milliseconds);
    }

    get days(): number {
        return Math.floor(this.totalMilliseconds / (24 * 60 * 60 * 1000));
    }

    get hours(): number {
        return Math.floor((this.totalMilliseconds) / (60 * 60 * 1000));
    }

    get minutes(): number {
        return Math.floor((this.totalMilliseconds % (60 * 60 * 1000)) / (60 * 1000));
    }

    get seconds(): number {
        return Math.floor((this.totalMilliseconds % (60 * 1000)) / 1000);
    }

    get milliseconds(): number {
        return this.totalMilliseconds;
    }

    get totalDays(): number {
        return this.totalMilliseconds / (24 * 60 * 60 * 1000);
    }

    get totalHours(): number {
        return this.totalMilliseconds / (60 * 60 * 1000);
    }

    get totalMinutes(): number {
        return this.totalMilliseconds / (60 * 1000);
    }

    get totalSeconds(): number {
        return this.totalMilliseconds / 1000;
    }

    get totalMiliseconds(): number {
        return this.totalMilliseconds;
    }

    add(timespan: TimeSpan): TimeSpan {
        return new TimeSpan(this.totalMilliseconds + timespan.totalMilliseconds);
    }

    subtract(timespan: TimeSpan): TimeSpan {
        return new TimeSpan(this.totalMilliseconds - timespan.totalMilliseconds);
    }

    toString(): string {
        return `${this.days}d ${this.hours}h ${this.minutes}m ${this.seconds}s ${this.milliseconds}ms`;
    }
}