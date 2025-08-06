import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/database'

export async function POST() {
  try {
    // Create sample athletics
    const { data: athletics, error: athleticsError } = await supabaseAdmin
      .from('athletics')
      .insert([
        {
          name: 'Atlética Medicina',
          university: 'Universidade Federal',
          logo_url: '/placeholder.svg?height=200&width=200'
        },
        {
          name: 'Atlética Engenharia',
          university: 'Universidade Estadual',
          logo_url: '/placeholder.svg?height=200&width=200'
        },
        {
          name: 'Atlética Direito',
          university: 'Universidade Particular',
          logo_url: '/placeholder.svg?height=200&width=200'
        }
      ])
      .select()

    if (athleticsError) throw athleticsError

    // Create sample sports
    const { data: sports, error: sportsError } = await supabaseAdmin
      .from('sports')
      .insert([
        { name: 'Futebol de Campo', type: 'sport', description: 'Futebol tradicional com 11 jogadores por time.' },
        { name: 'Vôlei', type: 'sport', description: 'Vôlei com 6 jogadores por time.' },
        { name: 'Basquete', type: 'sport', description: 'Basquete com 5 jogadores por time.' },
        { name: 'Sinuca', type: 'bar_game', description: 'Jogo de sinuca individual.' },
        { name: 'Truco', type: 'bar_game', description: 'Jogo de cartas em duplas.' }
      ])
      .select()

    if (sportsError) throw sportsError

    // Create sample packages
    const { data: packages, error: packagesError } = await supabaseAdmin
      .from('packages')
      .insert([
        {
          name: 'Pacote Básico',
          description: 'Participação em uma modalidade esportiva.',
          price: 50,
          includes_party: false
        },
        {
          name: 'Pacote Intermediário',
          description: 'Participação em até três modalidades esportivas.',
          price: 100,
          includes_party: false
        },
        {
          name: 'Pacote Completo',
          description: 'Participação em todas as modalidades + ingresso para a festa.',
          price: 150,
          includes_party: true
        }
      ])
      .select()

    if (packagesError) throw packagesError

    // Create sample tickets
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .insert([
        {
          event_name: 'Festa de Encerramento JISC',
          price: 80,
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          location: 'Clube Universitário',
          total_quantity: 500,
          remaining_quantity: 500
        },
        {
          event_name: 'After Party JISC',
          price: 50,
          date: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(), // 31 days from now
          location: 'Boate Central',
          total_quantity: 300,
          remaining_quantity: 300
        }
      ])
      .select()

    if (ticketsError) throw ticketsError

    // Create sample games
    const games = []
    for (const sport of sports) {
      // Create a game for each sport
      const startTime = new Date()
      startTime.setDate(startTime.getDate() + Math.floor(Math.random() * 14) + 1) // Random day in the next 2 weeks
      startTime.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0) // Between 10 AM and 6 PM

      const endTime = new Date(startTime)
      endTime.setHours(endTime.getHours() + 2) // 2 hours duration

      games.push({
        sport_id: sport.id,
        location: sport.type === 'sport' ? 'Ginásio Universitário' : 'Área de Jogos',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled'
      })
    }

    const { data: gamesData, error: gamesError } = await supabaseAdmin.from('games').insert(games).select()

    if (gamesError) throw gamesError

    // Add participants to games
    const gameParticipants = []
    for (const game of gamesData) {
      // Add two random athletics to each game
      const shuffledAthletics = [...athletics].sort(() => 0.5 - Math.random())
      gameParticipants.push(
        { game_id: game.id, athletic_id: shuffledAthletics[0].id },
        { game_id: game.id, athletic_id: shuffledAthletics[1].id }
      )
    }

    const { error: participantsError } = await supabaseAdmin.from('game_participants').insert(gameParticipants)

    if (participantsError) throw participantsError

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        athletics: athletics.length,
        sports: sports.length,
        packages: packages.length,
        tickets: tickets.length,
        games: gamesData.length,
        gameParticipants: gameParticipants.length
      }
    })
  } catch (error) {
    console.warn('Error seeding database:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
