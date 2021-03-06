ACTION alienrumblex::setweaponcnf(const uint64_t &template_id, const string &weapon_class,
                                  const uint8_t &attack, const uint8_t &defense) {
    // check for self auth
    require_auth(get_self());

    // get weapon config table
    weapons_conf_table weapon_confs(get_self(), get_self().value);
    auto weapon = weapon_confs.find(template_id);

    // if there's no config for this template
    if (weapon == weapon_confs.end()) {
        weapon_confs.emplace(get_self(), [&](auto &row) {
            row.template_id = template_id;
            row.weapon_class = weapon_class;
            row.attack = attack;
            row.defense = defense;
        });
    } else {
        // else: modify existing row
        weapon_confs.modify(weapon, same_payer, [&](auto &row) {
            row.template_id = template_id;
            row.weapon_class = weapon_class;
            row.attack = attack;
            row.defense = defense;
        });
    }
}

ACTION alienrumblex::setcrewcnf(const uint64_t &template_id, const string &race,
                                const string &element, const uint8_t &attack,
                                const uint8_t &defense) {
    // check for self auth
    require_auth(get_self());

    // get crew config table
    crews_conf_table crew_confs(get_self(), get_self().value);
    auto crew = crew_confs.find(template_id);

    // if there's no config for this template
    if (crew == crew_confs.end()) {
        crew_confs.emplace(get_self(), [&](auto &row) {
            row.template_id = template_id;
            row.race = race;
            row.element = element;
            row.attack = attack;
            row.defense = defense;
        });
    } else {
        // else: modify existing row
        crew_confs.modify(crew, same_payer, [&](auto &row) {
            row.template_id = template_id;
            row.race = race;
            row.element = element;
            row.attack = attack;
            row.defense = defense;
        });
    }
}

ACTION alienrumblex::setarena(const name &arena_name, const asset &cost, const uint8_t &fee) {
    // check for self auth
    require_auth(get_self());

    // check if the cost is valid
    check(cost.symbol == TLM_SYMBOL, "invalid token symbol");
    check(cost.amount > 0, "cost must be a positive amount");
    check(cost.is_valid(), "invalid quantity");

    // get arenas table
    auto arenas = get_arenas();

    auto arena = arenas.find(arena_name.value);

    // if there's no arena
    if (arena == arenas.end()) {
        arenas.emplace(get_self(), [&](auto &row) {
            row.name = arena_name;
            row.cost = extended_asset(cost, TLM_CONTRACT);
            row.fee = fee;
        });
    } else {
        // else: modify existing row
        arenas.modify(arena, same_payer, [&](auto &row) {
            row.name = arena_name;
            row.cost = extended_asset(cost, TLM_CONTRACT);
            row.fee = fee;
        });
    }
}

ACTION alienrumblex::rmarena(const name &arena_name) {
    // check for self auth
    require_auth(get_self());

    // get arenas table
    auto arenas = get_arenas();

    // find the specified arena
    auto arena = arenas.require_find(arena_name.value, "arena not found");

    // delete the arena row
    arenas.erase(arena);
}

ACTION alienrumblex::startbattle(const name &arena_name) {
    // check for self auth
    require_auth(get_self());

    // get arenas table
    auto arenas = get_arenas();

    // find the specified arena
    auto arena = arenas.require_find(arena_name.value, "arena not found");

    auto queues = get_queues();
    auto queue_size = distance(queues.cbegin(), queues.cend());

    check(queue_size > 0, "queue size must be > 0");

    auto crews = get_crews_conf();
    auto weapons = get_weapons_conf();

    map<name, float> warriors{};

    uint64_t warrior_count = 0;

    auto itr1 = queues.begin();

    while (itr1 != queues.end()) {
        // make a new queue list as itr1->queues is a const
        vector<queue_entry> new_queue(itr1->queues);

        auto arena_entry = find_if(new_queue.begin(), new_queue.end(),
                                   [&arena = arena_name](const queue_entry &entry) {
                                       return arena == entry.arena_name;
                                   });

        if (arena_entry == new_queue.end()) {
            itr1++;
            continue;
        }

        // erase the current entry
        new_queue.erase(arena_entry);

        ++warrior_count;

        // get the user's assets
        auto assets = atomicassets::get_assets(itr1->player);

        // check if user owns the specified assets
        auto minion = assets.find(arena_entry->minion_id);
        auto weapon = assets.find(arena_entry->weapon_id);

        // skip this user if they don't own these assets anymore
        if (minion == assets.end() || weapon == assets.end()) {
            queues.modify(itr1, same_payer, [&](auto &row) { row.queues = new_queue; });
            itr1++;
            continue;
        }

        // check if assets are valid
        auto minion_conf = crews.find(minion->template_id);
        auto weapon_conf = weapons.find(weapon->template_id);

        // skip this user if these assets are not valid
        // this shouldn't happen as the enterqueue action checks for this
        // but keep this check here just in case
        if (minion_conf == crews.end() || weapon_conf == weapons.end()) {
            queues.modify(itr1, same_payer, [&](auto &row) { row.queues = new_queue; });
            itr1++;
            continue;
        }

        // check if the minion & weapon have same
        float multiplier = minion_conf->element == weapon_conf->weapon_class ? 1.0 : 0.5;
        float score = multiplier * (minion_conf->attack + minion_conf->defense +
                                    weapon_conf->attack + weapon_conf->defense);
        warriors[itr1->player] = score;

        queues.modify(itr1, same_payer, [&](auto &row) { row.queues = new_queue; });
        itr1++;
    }

    check(warrior_count > 0, "no warriors are waiting for this arena");

    // sort the warriors by their score
    vector<name> players(warriors.size());

    transform(warriors.begin(), warriors.end(), players.begin(),
              [](pair<name, float> const &original) { return original.first; });

    // sort the warriors by their score
    vector<pair<float, name>> battle_result(warriors.size());

    transform(warriors.begin(), warriors.end(), battle_result.begin(),
              [](pair<name, float> const &original) {
                  return std::pair<float, name>(original.second, original.first);
              });
    sort(battle_result.begin(), battle_result.end(), std::greater<>());

    // pick the top 3
    auto contender1 = battle_result[0];
    auto contender2 = battle_result[1];
    auto contender3 = battle_result[2];

    // get battles table
    auto battles = get_battles();

    // insert a new record
    auto new_battle = battles.emplace(get_self(), [&](auto &row) {
        row.battle_id = battles.available_primary_key();
        row.arena_name = arena_name;
        row.players = players;
    });

    vector<name> contenders = {contender1.second, contender2.second, contender3.second};

    // pick a lucky winner
    uint64_t rand_index = tx_rand(3);
    auto winner = contenders[rand_index];

    // log the winner
    action(permission_level{get_self(), name("active")}, get_self(), name("logwinner"),
           make_tuple(new_battle->battle_id, winner))
        .send();
}

ACTION alienrumblex::logwinner(const uint64_t &battle_id, const name &winner) {
    // check for self auth
    require_auth(get_self());

    // get battles table
    auto battles = get_battles();

    // find the specified arena
    auto battle = battles.require_find(battle_id, "battle not found");

    // get arenas table
    auto arenas = get_arenas();

    // find the specified arena
    auto arena = arenas.require_find(battle->arena_name.value, "arena not found");

    auto warrior_count = distance(battle->players.cbegin(), battle->players.cend());

    battles.modify(battle, same_payer, [&](auto &row) {
        row.winner = winner;
        row.timestamp = time_point_sec(current_time_point());
    });

    // calculate the prize amount
    auto percentage = (100 - arena->fee) / 100.0f;
    auto prize = extended_asset(
        asset((uint64_t)(arena->cost.quantity.amount * warrior_count * percentage), TLM_SYMBOL),
        TLM_CONTRACT);

    auto account = check_user_registered(winner);

    // increase the balance and win_count of the winner
    get_accounts().modify(account, same_payer, [&](auto &row) {
        row.balance = account->balance + prize;
        row.win_count = account->win_count + 1;
    });
}

ACTION alienrumblex::fullreset() {
    // check for self auth
    require_auth(get_self());

    // get battles table
    auto battles = get_battles();

    // iterate through the rows and erase them
    auto itr_b = battles.begin();
    while (itr_b != battles.end()) {
        itr_b = battles.erase(itr_b);
    }

    // get queues table
    auto queues = get_queues();

    // iterate through the rows and erase them
    auto itr_q = queues.begin();
    while (itr_q != queues.end()) {
        itr_q = queues.erase(itr_q);
    }
}
