
alienrumblex::accounts_table::const_iterator
alienrumblex::check_user_registered(const name &user) {
    // get accounts table
    accounts_table accounts(get_self(), get_self().value);

    // check if user is registered
    return accounts.require_find(user.value, "user is not registered");
}

void alienrumblex::check_user_weapon(const name &user, const uint64_t &asset_id) {
    // get the user's assets
    auto assets = atomicassets::get_assets(user);

    // check if the weapon belongs to the user
    auto weapon = assets.require_find(
        asset_id, string("user doesn't own asset: " + to_string(asset_id)).c_str());

    // get the weapons configs
    auto weapon_confs = get_weapons_conf();

    // check if the minion belongs to the user
    weapon_confs.require_find(weapon->template_id,
                              string("asset " + to_string(asset_id) + " is not valid").c_str());
}

void alienrumblex::check_user_crew(const name &user, const uint64_t &asset_id) {
    // get the user's assets
    auto assets = atomicassets::get_assets(user);

    // check if the minion belongs to the user
    auto minion = assets.require_find(
        asset_id, string("user doesn't own asset: " + to_string(asset_id)).c_str());

    // get the crew configs
    auto crew_confs = get_crews_conf();

    // check if the minion belongs to the user
    crew_confs.require_find(minion->template_id,
                            string("asset " + to_string(asset_id) + " is not valid").c_str());
}

uint64_t alienrumblex::tx_rand(const uint64_t &upper_limit) {
    auto size = transaction_size();
    char buf[size];

    auto read = read_transaction(buf, size);
    check(size == read, "read_transaction() has failed.");

    auto tx_signing_value = sha256(buf, size);

    auto byte_array = tx_signing_value.extract_as_byte_array();

    uint64_t nonce_value = 0;
    for (int i = 0; i < 8; i++) {
        nonce_value <<= 8;
        nonce_value |= (uint64_t)byte_array[i];
    }
    return nonce_value % upper_limit;
}

// getter functions
alienrumblex::accounts_table alienrumblex::get_accounts() {
    return accounts_table(get_self(), get_self().value);
}

alienrumblex::weapons_conf_table alienrumblex::get_weapons_conf() {
    return weapons_conf_table(get_self(), get_self().value);
}

alienrumblex::crews_conf_table alienrumblex::get_crews_conf() {
    return crews_conf_table(get_self(), get_self().value);
}

alienrumblex::arenas_table alienrumblex::get_arenas() {
    return arenas_table(get_self(), get_self().value);
}

alienrumblex::queues_table alienrumblex::get_queues() {
    return queues_table(get_self(), get_self().value);
}

alienrumblex::battles_table alienrumblex::get_battles() {
    return battles_table(get_self(), get_self().value);
}
