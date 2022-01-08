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
    });
}

ACTION alienrumblex::stakeweapons(const name &user, const vector<uint64_t> &asset_ids) {
    // check for caller auth
    require_auth(user);

    // check if user is registered & find the user's account
    auto account = check_user_registered(user);

    // get the user's assets
    auto assets = atomicassets::get_assets(user);

    // get the user's weapons
    auto weapons = get_weapons();

    for (const uint64_t &asset_id : asset_ids) {
        // find the asset data, to get the template id from it
        auto asset = assets.require_find(
            asset_id, string("user doesn't own asset: " + to_string(asset_id)).c_str());

        // check if the asset's template is a valid weapon
        get_weapons_conf().require_find(
            asset->template_id,
            string("asset: " + to_string(asset->asset_id) + " is not a valid asset").c_str());

        auto weapon = weapons.find(asset_id);

        // if there's no config for this template
        if (weapon == weapons.end()) {
            weapons.emplace(user, [&](auto &row) {
                row.asset_id = asset_id;
                row.template_id = asset->template_id;
                row.owner = user;
            });
        } else {
            // else: modify existing row
            weapons.modify(weapon, same_payer, [&](auto &row) {
                row.asset_id = asset_id;
                row.template_id = asset->template_id;
                row.owner = user;
            });
        }
    }
}

ACTION alienrumblex::stakecrews(const name &user, const vector<uint64_t> &asset_ids) {
    // check for caller auth
    require_auth(user);

    // check if user is registered & find the user's account
    auto account = check_user_registered(user);

    // get the user's assets
    auto assets = atomicassets::get_assets(user);

    auto crews = get_crews();

    for (const uint64_t &asset_id : asset_ids) {
        // find the asset data, to get the template id from it
        auto asset = assets.require_find(
            asset_id, string("user doesn't own asset: " + to_string(asset_id)).c_str());

        // check if the asset's template is a valid minion
        get_crews_conf().require_find(
            asset->template_id,
            string("asset: " + to_string(asset->asset_id) + " is not a valid asset").c_str());

        auto minion = crews.find(asset_id);

        // if there's no config for this template
        if (minion == crews.end()) {
            crews.emplace(user, [&](auto &row) {
                row.asset_id = asset_id;
                row.template_id = asset->template_id;
                row.owner = user;
            });
        } else {
            // else: modify existing row
            crews.modify(minion, same_payer, [&](auto &row) {
                row.asset_id = asset_id;
                row.template_id = asset->template_id;
                row.owner = user;
            });
        }
    }
}

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

    auto queues = get_queues();

    auto queue_entry = queues.find(user.value);

    // check if user is not already entered in an arena
    check(queue_entry == queues.end(), "user has already entered an arena");

    // emplace a new row in the queue
    queues.emplace(user, [&](auto &row) {
        row.player = user;
        row.arena_name = arena_name;
        row.minion_id = minion_id;
        row.weapon_id = weapon_id;
    });

    uint64_t queue_size = 0;

    for (auto itr = queues.begin(); itr != queues.end(); ++itr) {
        if (itr->arena_name.value == arena_name.value) {
            ++queue_size;
        }
    }

    if (queue_size >= 8) {
        // start the battle
        action(permission_level{get_self(), name("active")}, get_self(), name("startbattle"),
               make_tuple(arena_name))
            .send();
    }
}

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
