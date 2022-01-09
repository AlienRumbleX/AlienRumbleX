# AlienRumbleX
Unofficial Thunderdome-like game based on Alien Worlds NFTs

A blockchain based game where players can use their Alien Worlds NFTs to participate in battles.

You can play the game here: [play.alienrumblex.com](https://play.alienrumblex.com/)

## Motivation
On 22 January 2021, Alien Worlds announced they'll be releasing **Thunderdome battles**, a game mode where:
> explorers get to put their Minions into fights against other Minions

###### *quote from [Medium](https://alienworlds.medium.com/the-thunderdome-battling-on-alien-worlds-a62f7a6d89fc)*

One year later, The Thunderdome is still yet to be released, so I decided to make **AlienRumbleX**, an unofficial open-source Thunderdome-like game running on WAX blockchain that gives players the ability to use their Alien Worlds NFTs in battles.

# Getting started

## Requirements

To start playing, you need will need the following:

* 1 minion NFT
* 1 weapon NFT
* some amount of TLM

## Gameplay

In order to play, you must first deposit some TLM to your in-game wallet.

Then choose an arena, select a minion and a weapon and send them to battle.

Once the arena join queue has 8 players, the battle begins automatically.

Once the battle finishes, the winner is declared and the prize is added to their balance.

### Battle Mechanics

Once a players enters an arena, the entry fee is deducted from their in-game balance.

The game then calculates a score based on the attributes of the NFTs (attack, defense, element/class) according to the following formula:

```
score = multiplier * (minion_attack + minion_defense + weapon_attack + weapon_defense)
```
where `multiplier` is either one of `1` or `0.5`:
```
1 (if minion_element = weapon_class)
0.5 (if minion_element != weapon_class)
```

###### *The formula used is very simple and basic, it might be updated in the future*

### Note
AlienRumbleX is not officially part of Alien Worlds, it is a community driven game based on some of Alien Worlds' NFTs and TLM token
