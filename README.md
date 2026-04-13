# SyncUp
### Team members
**Drake Hoffmann William Thomsen Ian Heathcote**

## Project Description
### Introduction

Our application plans to address the problem of having something else going on when people want to meet or collaborate. This is a common problem when planning events between friends or meetings between colleagues. It will make planning simpler by finding common time.

### Objectives

-   Provide an easy way to store and edit dates of important events or deadlines

-   Allows for the creation and syncing of group calendars

-   Add timeframes for each day


### Scope
**Will include:**

-   Personal calendar editing & saving

-   Sharing/syncing with others

-   Categories


-   Work

-   School

-   Personal

-   Etc.


-   Choose whether or not to share personal calendar’s event content, or just “busy” status


**Won’t include:**


-   GPS/location sharing

-   Messaging

-   LLMs


### Proposed Solution

Our application is a simple calendar logging system. It allows users to create events on certain dates and times to simplify scheduling. It will help them plan events together via syncing group calendars together. The ability to create groups will also be included. The application is going to be web based so it can run in the browser. It will keep track of all users and what groups they are a part of via a small database. The target users are families, friend groups, and small projects that need planned meetings/for deadlines. It will be a great organizational tool for anyone to use. And since we are using sqlite3 it works wonderfully as a personal calendar.

### Technology Stack

-   NodeJS

-   Astro framework

-   sqlite3

-   Languages:


-   HTML

-   CSS

-   JS

-   Typescript

-   SQL



### 7. Expected Outcomes

-   Prototype: Personal calendar, Caldav syncing with server, rudimentary UI

-   Features: Group syncing between users, event scheduling, time tables

-   How it solves the problem: It is an easy and simple way to schedule and keep track of any important dates and times.

### 8. How to run

-   Install Docker from link before running any files: https://www.docker.com/products/docker-desktop/

-   open terminal in root directory and run:
	- if on linux/mac:
		- chmod +x APPSetup.sh
		- ./AppSetup.sh
	- if on windows (in powershell):
		- .\setup.ps1

	- and you are ready to go, navigate to localhost:4321 in browser of choice to go to app
