# Custom Gambling Script for Firebot

A custom [Firebot][firebot] script that lets users gamble currency.
Inspired by the gambling script made by Castorr91 for the Streamlabs Chatbot.

## Setup

The latest version of this script can be downloaded on the
[Releases page][releases] in the right sidebar.

1. Enable custom script effects in the advanced settings of Firebot.

2. Add the `gamblingScript.js` as Startup Script in the advanced settings.

3. Create a counter that is used to store the jackpot.

4. Create a command. The trigger can be anything you want.

    ![Command Setup Overview](setup_images/command_setup_overview.png)

5. (Optional) add a subcommand that prints the current amount of points in the
    jackpot to chat.

    ![Command Setup Jackpot](setup_images/command_setup_jackpot.png)

6. If you used a subcommand in the previous step, use the fallback command to
    execute the ‘Custom Gambling’ Effect.
    Otherwise, add the ‘Custom Gambling’ as a regular effect under ‘Base
    Effects‘.

    ![Command Setup Script](setup_images/command_setup_script.png)

7. Adapt the parameters and messages the bot sends for different events as you
    like.
    Regular substitution of variables starting with `$` works as usual.
    Additionally, the script replaces other values as well:
    - `%roll`: the dice roll the script generated to determine how many points
        the user should receive.
    - `%amount`: the amount of points the user has won/lost with this gamble.
    - `%newTotal`: the new total amount of currency the user has after the
        gamble.
    - `%min`: the minimum amount of points that users are allowed to gamble
        (only ‘Message on Entry Too Few Points’).


## Modes

The ‘Jackpot Percent’ parameter defines how many of the lost points go into
the jackpot.
E.g. for a value of 50: if a user loses 80 points when gambling,
50% ⋅ 80 = 40 of those are added to the jackpot.
By setting the percentage to 0 or less the jackpot can be disabled.

In the following examples the user has 1000 currency and gambles 100 of those.
The jackpot contains 500 points.


### Percentage

The script generates a random number between 0 and 100 (inclusive).
When a 0 is rolled, the user loses all their gambled points, they now have got
900 currency.
When a 50 is rolled, the user neither wins nor loses any points.
When a 100 is rolled and the jackpot is active, the user wins the whole jackpot
and then have got 1500 points.
If not, the user wins as many points as they gambled, then having 1100 currency.

Between those values the wins/losses are calculated on a linear scale.
E.g. for a roll of 51 they win 2 points, for 52 they win 4 points, …,
for a roll of 99 they win 98 points.
It works the same way in the losing direction.
For a roll of 49 they lose 2 points, 48 results in 4 points lost, and so on.


### Threshold/Bigger Than Target

The script generates a random number between 0 and `maxRoll` (inclusive).
The setting ‘Threshold Win/Lose’ defines the gamble result:
- If the roll is less than the threshold:
  The user loses the 100 points they entered, then having 900 points.
- If the roll is exactly the threshold: The user neither wins not loses anything.
- If the roll is greater than the threshold:
  The user wins the entered points multiplied by the ‘Won Points Multiplicator’.
  E.g. for a value of `2`, they win 200 points, then having 1200.

The ‘Jackpot Target Roll‘ overrides those results.
If the roll is exactly the jackpot target, the user wins the entire jackpot of
500 points, then having 1500 points.
You can set the target to a value that can not be rolled in a regular game
(e.g. -1, or anything bigger than your value for `maxRoll`) to disable the
Jackpot.



## Usage

You have various options to gamble as a user in chat.
The `!gamble` command only works with exactly one argument in one of the
following formats:
- `all`: gamble all your current points,
- `x%`: gamble only `x` percent of your total points,
- `x`: gamble exactly `x` of your points.



# License

Licensed under the EUPL, Version 1.2 or – as soon as they will be approved by
the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at:
https://joinup.ec.europa.eu/software/page/eupl

Unless required by applicable law or agreed to in writing, software
distributed under the Licence is distributed on an "AS IS" basis,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and
limitations under the Licence.



[firebot]: https://github.com/crowbartools/Firebot
[releases]: https://github.com/pirak/firebot-gambling-script/releases
