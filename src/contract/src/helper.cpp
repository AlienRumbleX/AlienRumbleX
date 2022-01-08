
alienrumblex::accounts_table::const_iterator
alienrumblex::check_user_registered(const name &user) {
    // get accounts table
    accounts_table accounts(get_self(), get_self().value);

    // check if user is registered
    return accounts.require_find(user.value, "user is not registered");
}

alienrumblex::weapons_table::const_iterator
alienrumblex::check_user_weapon(const name &user, const uint64_t &asset_id) {
    // check if the weapon is staked
    auto weapon = get_weapons().require_find(asset_id, "weapon is not staked");

    // check if the weapon belongs to the user
    check(weapon->owner == user,
          string("user does not own asset " + to_string(asset_id)).c_str());

    return weapon;
}

alienrumblex::crews_table::const_iterator
alienrumblex::check_user_crew(const name &user, const uint64_t &asset_id) {
    // check if the minion is staked
    auto minion = get_crews().require_find(asset_id, "minion is not staked");

    // check if the minion belongs to the user
    check(minion->owner == user,
          string("user does not own asset " + to_string(asset_id)).c_str());

    return minion;
}

float alienrumblex::map_value(const uint64_t &value, const float &from_start,
                              const float &from_end, const float &to_start,
                              const float &to_end) {
    auto ratio = (to_end - to_start) / (from_end - from_start);
    return to_start + ratio * (value - from_start);
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

alienrumblex::weapons_table alienrumblex::get_weapons() {
    return weapons_table(get_self(), get_self().value);
}

alienrumblex::crews_table alienrumblex::get_crews() {
    return crews_table(get_self(), get_self().value);
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
