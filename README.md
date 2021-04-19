# Custom Gambling Script for Firebot

A custom [Firebot][firebot] script that lets users gamble currency.
Inspired by the gambling script made by Castorr91 for the Streamlabs Chatbot.

## Setup

1. Enable custom script effects in the advanced settings of Firebot.

2. Create a counter that is used to store the jackpot.

3. In the Settings open the root folder.
    In there are two important files:
    - `counters/counter.json`
    - `currency/currency.json`

    In the file `counters/counter.json` find the counter you created in step 2.
    Copy the `id` of that counter as highlighted below.
    Make sure to copy the `id` of the right counter, as the script will
    overwrite any value stored in it.

    Repeat the same for the `id` of your currency stored in
   `currency/currency.json`.

    ![counter.json](setup_images/counter_id.png "counter.json")

4. Create a command. The trigger can be anything you want.
    Add a custom script effect to it.
    You have to copy the`gamblingScript.js` into the correct folder.

5. Paste the two `id`s copied earlier into the correct option fields.
    Make sure that the human-readable names of the currency and jackpot are
    replaced by the correct values in the other options.

6. Adapt the messages the bot sends for different events as you like.
    Regular substitution of variables starting with `$` works as usual.
    Additionally, the script replaces other values as well:
    - `%roll`: the dice roll the script generated to determine how many points
        the user should receive.
    - `%amount`: the amount of points the user has won/lost with this gamble.
    - `%newTotal`: the new total amount of currency the user has after the
        gamble.


## Usage

As a user, you have various options to enter the gambling.
The `!gamble` command only works with exactly one argument in one of the
following formats:
- `all`: put all your points into the pool,
- `x%`: put only `x` percent of your points into the pool,
- `x`: put exactly `x` of your points into the pool.



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
