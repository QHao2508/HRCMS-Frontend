import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clubDateTime, clubTime, displayDate } from '../src/services/displayDate.js';
import { formatDuration, formatMetres, formatNumber, reportPeriod } from '../src/services/numberFormat.js';

test('instants show as dd/mm/yyyy HH:mm in club time, never with seconds', () => {
    assert.equal(clubDateTime('2026-10-28T02:00:00Z'), '28/10/2026 09:00');
    assert.equal(clubDateTime('2026-10-28T17:30:45Z'), '29/10/2026 00:30');
    assert.equal(clubTime('2026-10-28T02:05:00Z'), '09:05');
    assert.equal(clubDateTime(null), '—');
});

test('displayDate keeps calendar dates and converts instants to the club day', () => {
    assert.equal(displayDate('2020-03-15'), '15/03/2020');
    assert.equal(displayDate('2026-10-28T18:00:00Z'), '29/10/2026');
    assert.equal(displayDate(''), '—');
    assert.equal(displayDate('không phải ngày'), '—');
});

test('report numbers use Vietnamese grouping, readable durations and periods', () => {
    assert.equal(formatNumber(8000), '8.000');
    assert.equal(formatMetres(8000), '8.000 m');
    assert.equal(formatDuration(4000), '1 giờ 7 phút');
    assert.equal(formatDuration(3600), '1 giờ');
    assert.equal(formatDuration(900), '15 phút');
    assert.equal(formatDuration(45), '45 giây');
    assert.equal(formatDuration(null), '—');
    assert.equal(reportPeriod('2026-10-27'), '27/10/2026');
    assert.equal(reportPeriod('2026-10'), '10/2026');
    assert.equal(reportPeriod('2026-W44'), '2026-W44');
});
