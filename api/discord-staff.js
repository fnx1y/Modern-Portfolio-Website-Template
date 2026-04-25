export default async function handler(req, res) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!token || !guildId) {
      return res.status(500).json({ error: "Missing Discord environment variables." });
    }

    const targetRoleIds = [
      "1407926176466337852",
      "1474476569488658545",
      "1465196125752660232",
      "1481101982340222987",
      "1471663787223417064",
      "1471663893091979379",
      "1471663815761592465",
      "1443041247756292217",
      "1407929364993020096",
      "1488198966343635115",
      "1472340877807714336",
      "1407928098288304199",
      "1407928369995059240",
      "1479319810939555931",
      "1407928300159897723",
      "1470825402653085809",

      "1407928514967244891",
      "1479319489521909891",
      "1407928647918026924",
      "1407928992857587712",
      "1407928923223887954",
      "1407928958845980753"
    ];

    const rolesResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      {
        headers: {
          Authorization: `Bot ${token}`
        }
      }
    );

    if (!rolesResponse.ok) {
      const text = await rolesResponse.text();
      return res.status(rolesResponse.status).json({
        error: "Failed to fetch guild roles.",
        details: text
      });
    }

    const allRoles = await rolesResponse.json();

    const selectedRoles = targetRoleIds
      .map((id) => allRoles.find((role) => role.id === id))
      .filter(Boolean)
      .sort((a, b) => b.position - a.position);

    const members = [];
    let after = "0";

    while (true) {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000&after=${after}`,
        {
          headers: {
            Authorization: `Bot ${token}`
          }
        }
      );

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({
          error: "Failed to fetch guild members.",
          details: text
        });
      }

      const batch = await response.json();

      if (!Array.isArray(batch) || batch.length === 0) {
        break;
      }

      members.push(...batch);
      after = batch[batch.length - 1].user.id;

      if (batch.length < 1000) {
        break;
      }
    }

    const grouped = selectedRoles.map((role) => {
      const matched = members
        .filter((member) => Array.isArray(member.roles) && member.roles.includes(role.id))
        .map((member) => ({
          id: member.user.id,
          username: member.user.global_name || member.user.username,
          tag: member.user.username,
          avatar: member.user.avatar
            ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=128`
            : null
        }))
        .sort((a, b) => a.username.localeCompare(b.username));

      return {
        roleId: role.id,
        roleName: role.name,
        members: matched,
        position: role.position
      };
    });

    return res.status(200).json({ roles: grouped });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error."
    });
  }
}
