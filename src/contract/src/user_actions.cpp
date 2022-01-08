/*
    Register a new user and save them in accounts table

    @param {name} user - the name of the account

    @auth caller
*/
ACTION alienrumblex::regnewuser(const name &user) {
    // check for caller auth
    require_auth(user);

    // get accounts table
    accounts_table accounts(get_self(), get_self().value);
    auto account = accounts.find(user.value);

    // check if the account is not already registered
    check(account == accounts.end(), "user already registered");

    // emplace a new user row
    accounts.emplace(user, [&](auto &row) {
        row.account = user;
        row.balance = asset(0, TLM_SYMBOL);
        row.battle_count = 0;
        row.win_count = 0;
    });
}

/*
    Enter the user into the queue of the selected arena

    @param {name} user - the name of the account
    @param {name} arena_name - the name of the selected arena
    @param {uint64_t} minion_id - the asset_id of the chosen minion
    @param {uint64_t} weapon_id - the asset_id of the chosen weapon

    @auth caller
*/
ACTION alienrumblex::enterqueue(const name &user, const name &arena_name,
                                const uint64_t &minion_id, const uint64_t &weapon_id) {
    // check for caller auth
    require_auth(user);

    // check if user is registered & find the user's account
    auto account = check_user_registered(user);

    // check if a config exists
    auto arenas = get_arenas();

    auto arena = arenas.require_find(arena_name.value, "invalid arena");

    // check if the user has enough balance to enter
    check(account->balance >= arena->cost, "insufficient balance to enter this arena");

    // check if user provided assets are valid
    check_user_crew(user, minion_id);
    check_user_weapon(user, weapon_id);

    // get queues table
    auto queues = get_queues();

    // check if user is not already entered in an arena
    auto queue_entry = queues.find(user.value);
    check(queue_entry == queues.end(), "user has already entered an arena");

    // emplace a new row in the queue
    queues.emplace(user, [&](auto &row) {
        row.player = user;
        row.arena_name = arena_name;
        row.minion_id = minion_id;
        row.weapon_id = weapon_id;
    });

    auto accounts = get_accounts();
    // redefine account to avoid "object passed to modify is not in multi_index" issue
    account = accounts.find(user.value);

    // deduct the arena cost from the player's balance
    accounts.modify(account, same_payer, [&](auto &row) {
        row.balance = account->balance - arena->cost;
        row.battle_count = account->battle_count + 1;
    });

    // count the number of players in currently waiting for this arena
    uint64_t queue_size = 0;
    for (auto itr = queues.begin(); itr != queues.end(); ++itr) {
        if (itr->arena_name.value == arena_name.value) {
            ++queue_size;
        }
    }

    // start the battle
    if (queue_size >= 8) {
        // start the battle
        action(permission_level{get_self(), name("active")}, get_self(), name("startbattle"),
               make_tuple(arena_name))
            .send();
    }
}

/*
    Withdraw the balance from the user's in-game wallet

    @param {name} user - the name of the account
    @param {asset} quantity - the quantity to withdraw

    @auth caller
*/
ACTION alienrumblex::withdraw(const name &user, const asset &quantity) {
    // check for caller auth
    require_auth(user);

    // check if the quantity is valid
    check(quantity.is_valid(), "invalid quantity");
    check(quantity.symbol == TLM_SYMBOL, "invalid token symbol");

    // check if user is registered & find the user's account
    auto account = check_user_registered(user);

    // check if the user has enough balance to withdraw
    check(account->balance >= quantity, "overdrawn balance");

    // save new account stats
    get_accounts().modify(account, same_payer,
                          [&](auto &row) { row.balance = account->balance - quantity; });

    // send the amount
    action(permission_level{get_self(), name("active")}, TLM_CONTRACT, name("transfer"),
           make_tuple(get_self(), user, quantity, string("AlienRumbleX withdraw")))
        .send();
}

[[eosio::on_notify("alien.worlds::transfer")]] //
void alienrumblex::receive_tokens(name from, name to, asset quantity, string memo) {
    // ignore outgoing transactions and transaction not destined to the contract itself
    if (to != get_self() || from == get_self()) {
        return;
    }

    // ignore transactions if the memo isn't deposit
    if (memo != "deposit") {
        return;
    }

    // check if the quantity is valid
    check(quantity.is_valid(), "invalid quantity");
    check(quantity.symbol == TLM_SYMBOL, "invalid token symbol");

    // check if user is registered & find the user's account
    auto account = check_user_registered(from);

    // save new account stats
    get_accounts().modify(account, same_payer,
                          [&](auto &row) { row.balance = account->balance + quantity; });
}
