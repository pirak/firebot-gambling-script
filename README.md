# Custom Gambling Script for Firebot

A custom [Firebot][firebot] script that lets users gamble currency.
Inspired by the gambling script made by Castorr91 for the Streamlabs Chatbot.

## Setup

The latest version of this script can be downloaded on the
[Releases page][releases] in the right sidebar.

1. Enable custom script effects in the advanced settings of Firebot.

2. Create a counter that is used to store the jackpot.

3. In the Settings open the root folder.
    In there are two important files:
    - `counters/counter.json`
    - `currency/currency.json`

    In the file `counters/counter.json` find the counter you created in step 2.
    Repeat the same for the `id` of your currency stored in
   `currency/currency.json`.

    Keep the files open or copy the `id` of that counter as highlighted below
    into a temporary file.
    Make sure to copy the `id` of the right counter, as the script will
    overwrite any value stored in it.
    Those `id`s are needed later when setting up the command as parameters to
    the script.

    ![counter.json](setup_images/counter_id.png "counter.json")

4. Create a command. The trigger can be anything you want.

    ![Command Setup Overview](setup_images/command_setup_overview.png)

5. (Optional) add a subcommand that prints the current amount of points in the
    jackpot to chat.

    ![Command Setup Jackpot](setup_images/command_setup_jackpot.png)

6. Use the fallback command to execute the custom script effect.
    When creating that effect Firebot has a link that opens the folder you can
    copy `gamblingScript.js` (not the zip-file) into.

    ![Command Setup Script](setup_images/command_setup_script.png)

5. Paste the two `id`s copied earlier into the correct option fields.
    Make sure that the human-readable names of the currency and jackpot are
    replaced by the correct values in the other options.

    ![Command Setup Script Details](setup_images/command_setup_script_detail.png)

6. Adapt the messages the bot sends for different events as you like.
    Regular substitution of variables starting with `$` works as usual.
    Additionally, the script replaces other values as well:
    - `%roll`: the dice roll the script generated to determine how many points
        the user should receive.
    - `%amount`: the amount of points the user has won/lost with this gamble.
    - `%newTotal`: the new total amount of currency the user has after the
        gamble.
    - `%min`: the minimum amount of points that users are allowed to gamble
        (only ‘Message on Entry Too Few Points’).


## Usage

You have various options to enter the gambling as a user in chat.
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
