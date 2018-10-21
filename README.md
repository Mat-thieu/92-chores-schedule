# 92 Chores Schedule

A webtask script for sending the weekly chore schedule to all inhabitants of unit 92.

It uses SendGrid free plan to send emails.

Deciding who gets which task is based on the week number, there is currently a problem that when a new year starts this resets the schedule.
This should be relatively easy to fix by picking a start date and incrementing the week number from that date, but I haven't tried yet.